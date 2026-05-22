"""
PSU Portal Scraper — uses httpx + BeautifulSoup (no browser needed)
Works on Python 3.13, Windows, no C compiler required.
"""
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
import re

PORTAL_BASE = "https://psu362.campus-erp.com/portal"
LOGIN_URL   = f"{PORTAL_BASE}/Login.php"
MAIN_URL    = f"{PORTAL_BASE}/Main.php"
EVAL_URL    = f"{PORTAL_BASE}/CampusNet/RptSubjectAdvising.php"

# Grades that count as failed / incomplete
FAILED_GRADES = {"5.0", "5", "INC", "DRP", "DRPD", "NG", "W", "FAILED", "F", "0.0", "0"}

def grade_to_numeric(grade_str: str) -> float | None:
    """
    Convert grade string to numeric value for GPA computation.
    Returns None if the grade cannot be converted.
    PSU uses 1.0-5.0 scale where 1.0 is best.
    """
    if not grade_str:
        return None
    
    grade = grade_str.strip().upper()
    
    # Try to parse as decimal (1.0, 1.25, 2.5, 3.0, 5.0, etc.)
    try:
        numeric = float(grade)
        if 0.0 <= numeric <= 5.0:
            return numeric
    except ValueError:
        pass
    
    # Non-numeric grades don't count toward GPA
    # INC, DRP, NG, P, S, PASSED, FAILED, etc. are not included
    return None

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": LOGIN_URL,
}


class ScraperResult:
    def __init__(self):
        self.success          = False
        self.error            = None
        self.student_number   = None
        self.full_name        = None
        self.program          = None
        self.year_level       = None
        self.total_subjects   = 0
        self.passed_subjects  = 0
        self.failed_subjects  = []   # list of {code, description, grade}
        self.gpa              = None  # computed GPA
        self.is_eligible      = False
        self.eligibility_notes = ""


async def scrape_portal(student_number: str, portal_password: str) -> ScraperResult:
    result = ScraperResult()
    result.student_number = student_number

    try:
        # Use a persistent cookie jar (httpx follows cookies automatically)
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=30.0,
            verify=False,   # some campus portals have self-signed certs
        ) as client:

            # ── Step 1: GET login page to get any hidden fields / cookies ──
            login_page = await client.get(LOGIN_URL)
            soup = BeautifulSoup(login_page.text, "lxml")

            # Find the login form
            form = soup.find("form")
            
            # Collect all form fields (including hidden ones)
            payload = {}
            form_fields_found = []
            
            if form:
                for inp in form.find_all("input"):
                    name  = inp.get("name", "")
                    value = inp.get("value", "")
                    field_type = inp.get("type", "text").lower()
                    
                    if name:
                        # Store all fields for debugging
                        form_fields_found.append(f"{name}({field_type})")
                        payload[name] = value
            
            # Intelligently set credentials based on field names in the form
            username_field = None
            password_field = None
            
            # Search for username field
            for field_name in payload.keys():
                field_lower = field_name.lower()
                if any(x in field_lower for x in ["user", "name", "id", "student", "no"]):
                    username_field = field_name
                    break
            
            # Search for password field
            for field_name in payload.keys():
                field_lower = field_name.lower()
                if "password" in field_lower or "pass" in field_lower or "pwd" in field_lower:
                    password_field = field_name
                    break
            
            # If not found, try the most common names
            if not username_field:
                for field in ["UserName", "username", "UserNo", "userno", "user_name", "user"]:
                    if field in payload:
                        username_field = field
                        break
            
            if not password_field:
                for field in ["Password", "password", "PassWord", "pass", "pwd"]:
                    if field in payload:
                        password_field = field
                        break
            
            # Set credentials with found field names, or add new ones
            if username_field:
                payload[username_field] = student_number
            else:
                # If no field found, add both common variations
                payload["UserName"] = student_number
                payload["username"] = student_number
            
            if password_field:
                payload[password_field] = portal_password
            else:
                # If no field found, add both common variations
                payload["Password"] = portal_password
                payload["password"] = portal_password

            # Get form action URL
            action = LOGIN_URL
            if form and form.get("action"):
                action_path = form.get("action")
                if action_path.startswith("http"):
                    action = action_path
                else:
                    action = f"{PORTAL_BASE}/{action_path.lstrip('/')}"

            # ── Step 2: POST login ─────────────────────────────────────────
            login_resp = await client.post(action, data=payload)
            
            # Check for login failure
            login_text = login_resp.text.lower()
            current_url = str(login_resp.url)

            # Check if we're still on login page or got an error page
            if "login.php" in current_url.lower():
                # Still on login page - might be a failure
                error_keywords = ["invalid", "incorrect", "wrong", "failed", "error", "denied", "unauthorized"]
                if any(x in login_text for x in error_keywords):
                    result.error = "Invalid student number or portal password"
                    return result
                # Even without explicit error message, being stuck on login is suspicious
                # unless it's the initial GET
                if len(login_resp.history) > 0:
                    result.error = "Login failed - invalid credentials"
                    return result

            if "showerror" in current_url.lower():
                result.error = "Portal login error — check your credentials"
                return result

            # ── Step 3: Navigate to evaluation report ──────────────────────
            eval_resp = await client.get(EVAL_URL)
            eval_url  = str(eval_resp.url)

            if "login.php" in eval_url.lower() or "showerror" in eval_url.lower():
                result.error = "Login failed — invalid student number or password"
                return result

            html = eval_resp.text
            if not html.strip():
                result.error = "Empty response from portal"
                return result

            soup = BeautifulSoup(html, "lxml")

            # ── Step 4: Extract student info from the page ─────────────────
            page_text = soup.get_text(separator=" ", strip=True)

            # Try to find full name — usually in bold or a header cell
            # Pattern: "LASTNAME, FIRSTNAME MI." common in PH systems
            name_match = re.search(
                r"\b([A-Z]{2,}(?:[\s,\.][A-Z]+){1,4})\b",
                page_text
            )
            # Also look in specific tags
            for tag in soup.find_all(["b", "strong", "td", "th", "span"]):
                text = tag.get_text(strip=True)
                if re.match(r"^[A-Z]+,\s*[A-Z]", text) and len(text) > 5:
                    result.full_name = text
                    break

            # Extract program
            program_match = re.search(
                r"(BSIT|BS\s*IT|BSCS|BSECE|BSEE|BSCE|BSME|BSABE|BSIE|BSAT)",
                page_text, re.IGNORECASE
            )
            if program_match:
                prog = program_match.group(1).upper().replace(" ", "")
                if "IT" in prog:
                    result.program = "IT"
                elif "ABE" in prog or "ABEL" in prog or "AT" in prog:
                    result.program = "ABEL"
                elif any(e in prog for e in ["CE", "EE", "ECE", "ME", "IE"]):
                    result.program = "Engineering"
                else:
                    result.program = "Other"

            # Extract year level
            year_match = re.search(r"(\d)(?:st|nd|rd|th)?\s*[Yy]ear", page_text)
            if year_match:
                result.year_level = int(year_match.group(1))

            # ── Step 5: Parse grades table ─────────────────────────────────
            all_subjects  = []
            failed        = []

            tables = soup.find_all("table")
            
            for table in tables:
                rows = table.find_all("tr")
                for row in rows:
                    cells = row.find_all(["td", "th"])
                    if len(cells) < 2:
                        continue

                    texts = [c.get_text(strip=True) for c in cells]

                    # Subject code — more flexible matching
                    # PSU codes: CC101, IT101, MATH101, GE-ELEC1, CED101, etc.
                    code = texts[0]
                    
                    # More lenient regex: accept codes with letters + numbers
                    # Examples: CC101, IT101, MATH101, GE-ELEC1, CED-101, PHY2-1
                    is_subject_code = bool(re.match(
                        r"^[A-Z]{1,6}[\s\-]?\d+[A-Z]?$|^[A-Z]{2,}-[A-Z0-9]+\d*$|^[A-Z]+\d+-\d+[A-Z]?$",
                        code
                    ))
                    
                    if not is_subject_code:
                        # Also check if it looks like a subject code even with extra spaces
                        if len(code) >= 3 and any(c.isdigit() for c in code) and any(c.isalpha() for c in code):
                            # This might be a subject code, let's try it
                            pass
                        else:
                            continue

                    description = texts[1] if len(texts) > 1 else ""

                    # Find grade value — scan all columns from 2 onwards
                    grade = ""
                    for i in range(2, len(texts)):
                        t = texts[i].strip()
                        if not t:
                            continue
                        
                        # More flexible grade patterns
                        # Includes: 1.0, 1.25, 1.5, 2.0, 3.0, 5.0, INC, DRP, NG, P, S, PASSED, FAILED, W
                        if re.match(
                            r"^\d\.\d{1,2}$|^[0-5]\.0$|^[0-5]$|^INC$|^DRP$|^DRPD$|^NG$|^P$|^S$|^PASSED$|^FAILED$|^W$|^CM$|^CMPL$",
                            t, re.I
                        ):
                            grade = t.upper()
                            break

                    # Only add if we have at least a code
                    if code:
                        subject = {
                            "code":        code,
                            "description": description,
                            "grade":       grade,
                        }
                        all_subjects.append(subject)

                        if grade and grade in FAILED_GRADES:
                            failed.append(subject)

            # If still no subjects, try a more aggressive parsing
            if len(all_subjects) == 0:
                # Look for any text that looks like grades (decimal numbers)
                for table in tables:
                    rows = table.find_all("tr")
                    for row in rows:
                        cells = row.find_all(["td", "th"])
                        texts = [c.get_text(strip=True) for c in cells]
                        
                        # Look for rows with grade-like values
                        for text in texts:
                            # Match decimal grades: 1.0, 2.5, 3.0 etc
                            if re.match(r"^[0-5]\.\d{1,2}$|^[0-5]\.0$", text):
                                # Found a grade, back up to find the code
                                for t in texts[:texts.index(text)]:
                                    if len(t) >= 2 and any(c.isalpha() for c in t) and any(c.isdigit() for c in t):
                                        code = t
                                        description = ""
                                        grade = text.upper()
                                        
                                        subject = {
                                            "code": code,
                                            "description": description,
                                            "grade": grade,
                                        }
                                        all_subjects.append(subject)
                                        
                                        if grade in FAILED_GRADES:
                                            failed.append(subject)
                                        break

            result.total_subjects  = len(all_subjects)
            result.passed_subjects = len(all_subjects) - len(failed)
            result.failed_subjects = failed

            # Compute GPA from numeric grades
            numeric_grades = []
            for subject in all_subjects:
                grade_value = grade_to_numeric(subject.get("grade", ""))
                if grade_value is not None:
                    numeric_grades.append(grade_value)
            
            if numeric_grades:
                result.gpa = round(sum(numeric_grades) / len(numeric_grades), 2)

            if result.total_subjects == 0:
                # Page loaded but no subjects found — scraping issue
                # Instead of failing, set a note and allow verification to proceed
                # The important part is we successfully authenticated
                result.eligibility_notes = "Could not automatically parse grades from portal. Manual verification may be needed."
                result.is_eligible = True  # Default to eligible until proven otherwise
                result.success = True  # Login succeeded, parsing just had issues
                return result

            result.is_eligible = len(failed) == 0
            if result.is_eligible:
                result.eligibility_notes = f"All {result.total_subjects} subjects passed. Eligible for OJT."
            else:
                codes = ", ".join(s["code"] for s in failed)
                result.eligibility_notes = f"Has failed/incomplete subjects: {codes}"

            result.success = True
            return result

    except httpx.TimeoutException:
        result.error = "Portal request timed out. Please try again."
        return result
    except Exception as e:
        result.error = f"Scraper error: {str(e)}"
        return result
