import fitz

doc = fitz.open(r"C:\Users\salah\Desktop\files\arr cadre\AR 2019 43.pdf")
text = ""
# Extract pages 11 to 22 (0-indexed: 10 to 21)
for i in range(10, 22):
    text += doc[i].get_text() + "\n"

with open("extracted.txt", "w", encoding="utf-8") as f:
    f.write(text)

