-- Etapa de 21/08: documento e e-mail únicos.
CREATE UNIQUE INDEX "Customer_ident_document_key" ON "Customer"("ident_document");
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
