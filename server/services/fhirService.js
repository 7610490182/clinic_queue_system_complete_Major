/**
 * ABDM (Ayushman Bharat Digital Mission) & HL7 FHIR R4 Interoperability Service
 * Generates standardized FHIR R4 compliant healthcare resources for Indian digital health exchange.
 */

/**
 * Validates 14-digit Indian ABHA ID format: XX-XXXX-XXXX-XXXX or 14 digits
 */
function validateAbhaId(abhaId) {
  if (!abhaId) return false;
  const cleaned = abhaId.replace(/[-\s]/g, '');
  return /^\d{14}$/.test(cleaned);
}

/**
 * Validates ABHA Address (PHR Address format: name@abdm)
 */
function validateAbhaAddress(address) {
  if (!address) return false;
  return /^[a-zA-Z0-9._-]+@(abdm|sbx|ndhm)$/i.test(address);
}

/**
 * Converts a MongoDB User (Patient) to HL7 FHIR R4 Patient Resource
 */
function toFHIRPatient(user) {
  return {
    resourceType: 'Patient',
    id: user._id.toString(),
    meta: {
      versionId: '1',
      lastUpdated: user.createdAt || new Date().toISOString(),
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient']
    },
    identifier: [
      {
        system: 'https://healthid.ndhm.gov.in',
        type: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR', display: 'Medical Record Number' }]
        },
        value: user.healthCardId || `MQ-${user._id.toString().substring(0, 6).toUpperCase()}`
      },
      ...(user.abhaId ? [{
        system: 'https://ndhm.in/abha',
        type: {
          coding: [{ system: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/IdentifierType', code: 'ABHA', display: 'Ayushman Bharat Health Account' }]
        },
        value: user.abhaId
      }] : [])
    ],
    active: true,
    name: [
      {
        use: 'official',
        text: user.name
      }
    ],
    telecom: [
      ...(user.phone ? [{ system: 'phone', value: user.phone, use: 'mobile' }] : []),
      ...(user.email ? [{ system: 'email', value: user.email }] : [])
    ],
    gender: (user.gender || 'other').toLowerCase(),
    address: [
      {
        use: 'home',
        text: user.address || 'Gwalior, Madhya Pradesh, India',
        city: 'Gwalior',
        state: 'Madhya Pradesh',
        country: 'IN'
      }
    ]
  };
}

/**
 * Converts a Doctor to HL7 FHIR R4 Practitioner Resource
 */
function toFHIRPractitioner(doctor) {
  return {
    resourceType: 'Practitioner',
    id: doctor._id.toString(),
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner']
    },
    identifier: [
      {
        system: 'https://mciindia.org',
        value: `MCI-MP-${doctor.email.split('@')[0].toUpperCase()}`
      }
    ],
    name: [
      {
        prefix: ['Dr.'],
        text: doctor.name
      }
    ],
    telecom: [
      ...(doctor.phone ? [{ system: 'phone', value: doctor.phone }] : []),
      ...(doctor.email ? [{ system: 'email', value: doctor.email }] : [])
    ],
    qualification: [
      {
        code: {
          coding: [{ system: 'http://snomed.info/sct', display: doctor.specialization }]
        }
      }
    ]
  };
}

/**
 * Converts Appointment to HL7 FHIR R4 Appointment Resource
 */
function toFHIRAppointment(appointment, patient, doctor) {
  return {
    resourceType: 'Appointment',
    id: appointment._id.toString(),
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Appointment']
    },
    identifier: [
      {
        system: 'https://gwaliorclinic.queue/tokens',
        value: `TOKEN-${appointment.tokenNumber}`
      }
    ],
    status: appointment.status === 'completed' ? 'fulfilled' : 'booked',
    serviceCategory: [
      {
        coding: [{ system: 'http://snomed.info/sct', display: doctor?.specialization || 'Clinical Consultation' }]
      }
    ],
    start: appointment.date ? new Date(appointment.date).toISOString() : new Date().toISOString(),
    created: appointment.createdAt || new Date().toISOString(),
    comment: `Token #${appointment.tokenNumber} | Priority: ${appointment.priority || 'normal'} | CheckIn: ${appointment.checkInCode || 'N/A'}`,
    participant: [
      {
        actor: {
          reference: `Patient/${patient?._id || appointment.patient}`,
          display: patient?.name || 'Patient'
        },
        status: 'accepted'
      },
      {
        actor: {
          reference: `Practitioner/${doctor?._id || appointment.doctor}`,
          display: doctor?.name || 'Doctor'
        },
        status: 'accepted'
      }
    ]
  };
}

/**
 * Generates an ABDM Compliant FHIR R4 Bundle containing Patient, Practitioner, Appointment & Encounter
 */
function toFHIRBundle(appointment, patient, doctor) {
  const fhirPatient = toFHIRPatient(patient);
  const fhirPractitioner = toFHIRPractitioner(doctor);
  const fhirAppointment = toFHIRAppointment(appointment, patient, doctor);

  return {
    resourceType: 'Bundle',
    id: `bundle-${appointment._id.toString()}`,
    meta: {
      lastUpdated: new Date().toISOString()
    },
    type: 'collection',
    entry: [
      { fullUrl: `urn:uuid:${fhirPatient.id}`, resource: fhirPatient },
      { fullUrl: `urn:uuid:${fhirPractitioner.id}`, resource: fhirPractitioner },
      { fullUrl: `urn:uuid:${fhirAppointment.id}`, resource: fhirAppointment }
    ]
  };
}

module.exports = {
  validateAbhaId,
  validateAbhaAddress,
  toFHIRPatient,
  toFHIRPractitioner,
  toFHIRAppointment,
  toFHIRBundle
};

