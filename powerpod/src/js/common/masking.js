// supported masking types
export const FieldMaskType = {
  CRA: 'CRA',
  PostalCode: 'PostalCode',
  PhoneNumber: 'PhoneNumber',
  Number: 'Number',
  Email: 'Email',
  EfpId: 'EfpId',
};

// map mask type to jquery mask format
export const MaskTypeFormat = {
  CRA: '000000000',
  PostalCode: 'S0S 0S0',
  PhoneNumber: '(000) 000-0000',
  EfpId: 'EFP-000000-00000',
};
