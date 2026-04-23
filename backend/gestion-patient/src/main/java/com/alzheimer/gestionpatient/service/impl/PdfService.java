package com.alzheimer.gestionpatient.service.impl;

import com.alzheimer.gestionpatient.entity.Patient;
import com.alzheimer.gestionpatient.entity.Treatment;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;

@Service
public class PdfService {

    public byte[] generateTreatmentPdf(Patient patient) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);

        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
            Paragraph title = new Paragraph(
                    "Treatments Report for " + patient.getFirstName() + " " + patient.getLastName(),
                    titleFont
            );
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);

            Font headerFont = new Font(Font.HELVETICA, 12, Font.BOLD, Color.WHITE);
            String[] headers = {"Medication", "Dosage", "Frequency", "Start Date", "End Date", "Status"};

            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setBackgroundColor(new Color(63, 81, 181));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(8);
                table.addCell(cell);
            }

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            Font cellFont = new Font(Font.HELVETICA, 10);

            if (patient.getTreatments() != null) {
                for (Treatment t : patient.getTreatments()) {
                    table.addCell(new Phrase(t.getTreatmentName() != null ? t.getTreatmentName() : "", cellFont));
                    table.addCell(new Phrase(t.getDosage() != null ? t.getDosage() : "", cellFont));
                    table.addCell(new Phrase(t.getFrequency() != null ? t.getFrequency() : "", cellFont));
                    table.addCell(new Phrase(t.getStartDate() != null ? sdf.format(t.getStartDate()) : "", cellFont));
                    table.addCell(new Phrase(t.getEndDate() != null ? sdf.format(t.getEndDate()) : "", cellFont));
                    table.addCell(new Phrase(t.getStatus() != null ? t.getStatus() : "", cellFont));
                }
            }

            document.add(table);
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        } finally {
            document.close();
        }

        return baos.toByteArray();
    }
}
