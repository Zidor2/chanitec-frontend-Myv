export type MeasurementKey =
  | 'generalVoltage'
  | 'generalCurrent'
  | 'compressorCurrent'
  | 'condenserFanCurrent'
  | 'evaporatorFanCurrent'
  | 'highPressure'
  | 'lowPressure'
  | 'supplyAirTemp'
  | 'roomTemp'
  | 'supplyAirFlow';

export interface EquipmentItem {
  description: string;
  quantity: string;
}

export interface PrintInterventionData {
  client: string;
  site: string;
  date: string;
  location: string;
  arrivalTime: string;
  departureTime: string;
  machineNumber: string;
  brand: string;
  serialNumber: string;
  power: string;
  interventionObject: string;
  reason: string;
  jobNumber: string;
  sheetNumber: string;
  exteriorChecks: {
    overheating: boolean;
    vibration: boolean;
    electricalConnections: boolean;
    electricalWiring: boolean;
    condenserCleaning: boolean;
    exteriorUnitVerification: boolean;
    speedDriveVerification: boolean;
  };
  electricalTests: {
    lowPressureSafety: boolean;
    highPressureSafety: boolean;
    forcedOperation: boolean;
    faultSwitchover: boolean;
  };
  connections: {
    refrigerationCircuitFixation: boolean;
    refrigerationCircuitInsulation: boolean;
    electricalCircuitFixation: boolean;
  };
  controlBox: {
    cleaning: boolean;
    electricalConnections: boolean;
    fuses: boolean;
    indicators: boolean;
    timer: boolean;
  };
  measurements: Record<MeasurementKey, string[]>;
  dismantledEquipment: EquipmentItem[];
  installedEquipment: EquipmentItem[];
  clientObservation: string;
  chanicObservation: string;
  clientSignature: string;
  chanicSignature: string;
}

const emptyClimValues = (): string[] => ['', '', '', ''];

export const EMPTY_PRINT_INTERVENTION_DATA: PrintInterventionData = {
  client: '',
  site: '',
  date: '',
  location: '',
  arrivalTime: '',
  departureTime: '',
  machineNumber: '',
  brand: '',
  serialNumber: '',
  power: '',
  interventionObject: '',
  reason: '',
  jobNumber: '',
  sheetNumber: '',
  exteriorChecks: {
    overheating: false,
    vibration: false,
    electricalConnections: false,
    electricalWiring: false,
    condenserCleaning: false,
    exteriorUnitVerification: false,
    speedDriveVerification: false
  },
  electricalTests: {
    lowPressureSafety: false,
    highPressureSafety: false,
    forcedOperation: false,
    faultSwitchover: false
  },
  connections: {
    refrigerationCircuitFixation: false,
    refrigerationCircuitInsulation: false,
    electricalCircuitFixation: false
  },
  controlBox: {
    cleaning: false,
    electricalConnections: false,
    fuses: false,
    indicators: false,
    timer: false
  },
  measurements: {
    generalVoltage: emptyClimValues(),
    generalCurrent: emptyClimValues(),
    compressorCurrent: emptyClimValues(),
    condenserFanCurrent: emptyClimValues(),
    evaporatorFanCurrent: emptyClimValues(),
    highPressure: emptyClimValues(),
    lowPressure: emptyClimValues(),
    supplyAirTemp: emptyClimValues(),
    roomTemp: emptyClimValues(),
    supplyAirFlow: emptyClimValues()
  },
  dismantledEquipment: [
    { description: '', quantity: '' },
    { description: '', quantity: '' },
    { description: '', quantity: '' },
    { description: '', quantity: '' }
  ],
  installedEquipment: [
    { description: '', quantity: '' },
    { description: '', quantity: '' },
    { description: '', quantity: '' },
    { description: '', quantity: '' }
  ],
  clientObservation: '',
  chanicObservation: '',
  clientSignature: '',
  chanicSignature: ''
};
