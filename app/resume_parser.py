from pypdf import PdfReader
import re

def extract_text(file_path):
    reader = PdfReader(file_path)
    text = ""

    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"

    text = re.sub(r'\s+', ' ', text)
    return text.strip()