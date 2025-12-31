export interface ScanDebugData {
    cropImage?: string;
    rawImage?: string;
    line1FromModel?: string;
    line2FromModel?: string;
    line1Image?: string;
    line2Image?: string;
    line1Size?: string;
    line2Size?: string;
    validationError?: string;
}

export interface PassportData {
    fullName: string;
    passportNumber: string;
    nationality: string;
    dob: string;
    gender: string;
    expiryDate: string;
    issuingCountry: string;
    mrzRaw: string;
}
