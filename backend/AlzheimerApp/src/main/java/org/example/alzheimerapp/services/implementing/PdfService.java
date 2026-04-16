package org.example.alzheimerapp.services.implementing;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.example.alzheimerapp.entities.Patient;
import org.example.alzheimerapp.entities.Treatment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;

@Service
public class PdfService {

    public byte[] generateTreatmentPdf(Patient patient) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        // Create the document with A4 margins
        Document document = new Document(PageSize.A4, 36, 36, 50, 50);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Font styles
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Font.NORMAL);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Font.NORMAL);
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Font.NORMAL);
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.NORMAL);

            // Add Title
            Paragraph title = new Paragraph("Patient Treatments Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20f);
            document.add(title);

            // Add Patient Details
            document.add(new Paragraph("First Name: " + (patient.getFirstName() != null ? patient.getFirstName() : ""),
                    regularFont));
            document.add(new Paragraph("Last Name: " + (patient.getLastName() != null ? patient.getLastName() : ""),
                    regularFont));

            SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd");
            String dateStr = df.format(new Date());
            document.add(new Paragraph("Report Generated On: " + dateStr, regularFont));
            document.add(Chunk.NEWLINE);
            document.add(new Paragraph("Treatments History", subtitleFont));
            document.add(Chunk.NEWLINE);

            // Create Table for Treatments (6 columns)
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);

            // Set Column Widths
            float[] columnWidths = { 2f, 2f, 2f, 2f, 2f, 1.5f };
            table.setWidths(columnWidths);

            // Add Table Headers
            String[] headers = { "Medication", "Dosage", "Frequency", "Start Date", "End Date", "Status" };
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, tableHeaderFont));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                cell.setPadding(8f);
                cell.setBackgroundColor(new java.awt.Color(230, 230, 250)); // Light purple/blue header
                table.addCell(cell);
            }

            // Fill Data Rows
            if (patient.getTreatments() != null && !patient.getTreatments().isEmpty()) {
                for (Treatment treatment : patient.getTreatments()) {
                    table.addCell(createCell(treatment.getTreatmentName(), regularFont));
                    table.addCell(createCell(treatment.getDosage(), regularFont));
                    table.addCell(createCell(treatment.getFrequency(), regularFont));
                    table.addCell(
                            createCell(treatment.getStartDate() != null ? df.format(treatment.getStartDate()) : "N/A",
                                    regularFont));
                    table.addCell(
                            createCell(treatment.getEndDate() != null ? df.format(treatment.getEndDate()) : "Ongoing",
                                    regularFont));
                    table.addCell(
                            createCell(treatment.getStatus() != null ? treatment.getStatus() : "N/A", regularFont));
                }
            } else {
                PdfPCell emptyCell = new PdfPCell(new Phrase("No treatments found for this patient.", regularFont));
                emptyCell.setColspan(6);
                emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                emptyCell.setPadding(10f);
                table.addCell(emptyCell);
            }

            document.add(table);
            document.close();

        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }

    private PdfPCell createCell(String content, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(content != null ? content : "N/A", font));
        cell.setPadding(6f);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }
}
