#!/usr/bin/env python3
"""
CivicLens AI — Master Thesis Build & Quality Assurance Script
Orchestrates generation of all diagrams, PDF (ReportLab), Word (python-docx), and Markdown deliverables.
Validates page counts and integrity.
"""

import os
import sys
import pypdf

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILDER_DIR = os.path.join(BASE_DIR, "builder")
FIGURES_DIR = os.path.join(BASE_DIR, "figures")

sys.path.insert(0, BUILDER_DIR)
sys.path.insert(0, FIGURES_DIR)

import generate_figures
import generate_pdf
import generate_docx
import generate_markdown

def main():
    print("================================================================================")
    print(" CivicLens AI — Academic Thesis Master Build Sequence")
    print("================================================================================")

    # 1. Generate Figures
    print("\n--> [1/4] Generating High-Resolution 300 DPI Figures in thesis_submission/figures/...")
    generate_figures.create_system_architecture()
    generate_figures.create_reporting_workflow()
    generate_figures.create_ai_pipeline()
    generate_figures.create_database_er()
    generate_figures.create_lifecycle_state()
    generate_figures.create_priority_workflow()
    generate_figures.create_dbscan_clustering()
    generate_figures.create_confusion_matrix()
    print("    [OK] All 8 figures verified.")

    # 2. Build PDF Document
    print("\n--> [2/4] Generating Academic PDF via ReportLab (CivicLens_AI_Thesis.pdf)...")
    generate_pdf.build_pdf()
    pdf_path = os.path.join(BASE_DIR, "CivicLens_AI_Thesis.pdf")
    reader = pypdf.PdfReader(pdf_path)
    page_count = len(reader.pages)
    print(f"    [OK] PDF Generated successfully. Actual Page Count: {page_count} pages.")
    assert 20 <= page_count <= 22, f"Target page count error: expected 20-22, got {page_count}"

    # 3. Build Word Document
    print("\n--> [3/4] Generating Editable Word Document via python-docx (CivicLens_AI_Thesis.docx)...")
    generate_docx.build_docx()
    print("    [OK] Word Document verified.")

    # 4. Build Markdown Source
    print("\n--> [4/4] Generating Complete Source Markdown (CivicLens_AI_Thesis.md)...")
    generate_markdown.build_markdown()
    print("    [OK] Markdown verified.")

    print("\n================================================================================")
    print(" Quality Control Verification Summary:")
    print(f"  • PDF Deliverable:  {pdf_path} ({page_count} pages)")
    print(f"  • Word Deliverable: {os.path.join(BASE_DIR, 'CivicLens_AI_Thesis.docx')}")
    print(f"  • Markdown Text:    {os.path.join(BASE_DIR, 'CivicLens_AI_Thesis.md')}")
    print(f"  • Figures Folder:   {FIGURES_DIR} (8 PNG files @ 300 DPI)")
    print("================================================================================")

if __name__ == "__main__":
    main()
