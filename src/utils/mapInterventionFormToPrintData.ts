import {
  EMPTY_PRINT_INTERVENTION_DATA,
  EquipmentItem,
  MeasurementKey,
  PrintInterventionData
} from '../types/interventionPrint';

const MEASUREMENT_KEYS: MeasurementKey[] = [
  'generalVoltage',
  'generalCurrent',
  'compressorCurrent',
  'condenserFanCurrent',
  'evaporatorFanCurrent',
  'highPressure',
  'lowPressure',
  'supplyAirTemp',
  'roomTemp',
  'supplyAirFlow'
];

export const INTERVENTION_PRINT_SNAPSHOT_KEY = 'interventionPrintSnapshot';

export interface InterventionPrintSnapshot {
  id: string;
  data: PrintInterventionData;
  savedAt: number;
}

function toText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

function padClimValues(values: string[] | undefined): string[] {
  const next = Array.isArray(values) ? values.map((v) => toText(v)) : [];
  while (next.length < 4) next.push('');
  return next.slice(0, 4);
}

function padEquipment(items: EquipmentItem[] | undefined): EquipmentItem[] {
  const next = Array.isArray(items)
    ? items.map((item) => ({
        description: toText(item?.description),
        quantity: toText(item?.quantity)
      }))
    : [];
  while (next.length < 4) {
    next.push({ description: '', quantity: '' });
  }
  return next;
}

function formatDateForPrint(value: string): string {
  if (!value) return '';
  // Keep ISO date inputs readable (YYYY-MM-DD -> DD/MM/YYYY)
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
}

function formatTimeForPrint(value: string): string {
  if (!value) return '';
  return value.slice(0, 5);
}

export interface InterventionFormLike {
  jobNumber?: string;
  sheetNumber?: string;
  date?: string;
  location?: string;
  serialNumber?: string;
  power?: string;
  arrivalTime?: string;
  departureTime?: string;
  machineNumber?: string;
  brand?: string;
  interventionObject?: string;
  reason?: string;
  exteriorChecks: PrintInterventionData['exteriorChecks'];
  measurements: Record<MeasurementKey, string[]>;
  electricalTests: PrintInterventionData['electricalTests'];
  connections: PrintInterventionData['connections'];
  controlBox: PrintInterventionData['controlBox'];
  dismantledEquipment: EquipmentItem[];
  installedEquipment: EquipmentItem[];
  clientObservation?: string;
  chanicObservation?: string;
  clientSignature?: string;
  chanicSignature?: string;
}

export function mapInterventionFormToPrintData(
  formData: InterventionFormLike,
  extras: { clientName?: string; siteName?: string } = {}
): PrintInterventionData {
  const measurements = { ...EMPTY_PRINT_INTERVENTION_DATA.measurements };
  MEASUREMENT_KEYS.forEach((key) => {
    measurements[key] = padClimValues(formData.measurements?.[key]);
  });

  return {
    ...EMPTY_PRINT_INTERVENTION_DATA,
    client: toText(extras.clientName),
    site: toText(extras.siteName),
    date: formatDateForPrint(toText(formData.date)),
    location: toText(formData.location),
    arrivalTime: formatTimeForPrint(toText(formData.arrivalTime)),
    departureTime: formatTimeForPrint(toText(formData.departureTime)),
    machineNumber: (() => {
      const machine = toText(formData.machineNumber);
      const serial = toText(formData.serialNumber);
      if (machine && serial && !machine.includes(serial)) {
        return `${machine} (${serial})`;
      }
      return machine;
    })(),
    brand: toText(formData.brand),
    serialNumber: toText(formData.serialNumber) || (() => {
      const machine = toText(formData.machineNumber);
      const paren = machine.match(/\(([^)]+)\)\s*$/);
      return paren?.[1]?.trim() || '';
    })(),
    power: toText(formData.power),
    interventionObject: toText(formData.interventionObject),
    reason: toText(formData.reason),
    jobNumber: toText(formData.jobNumber),
    sheetNumber: toText(formData.sheetNumber),
    exteriorChecks: { ...EMPTY_PRINT_INTERVENTION_DATA.exteriorChecks, ...formData.exteriorChecks },
    electricalTests: { ...EMPTY_PRINT_INTERVENTION_DATA.electricalTests, ...formData.electricalTests },
    connections: { ...EMPTY_PRINT_INTERVENTION_DATA.connections, ...formData.connections },
    controlBox: { ...EMPTY_PRINT_INTERVENTION_DATA.controlBox, ...formData.controlBox },
    measurements,
    dismantledEquipment: padEquipment(formData.dismantledEquipment),
    installedEquipment: padEquipment(formData.installedEquipment),
    clientObservation: toText(formData.clientObservation),
    chanicObservation: toText(formData.chanicObservation),
    clientSignature: toText(formData.clientSignature),
    chanicSignature: toText(formData.chanicSignature)
  };
}

export function saveInterventionPrintSnapshot(id: string, data: PrintInterventionData): void {
  const snapshot: InterventionPrintSnapshot = {
    id: String(id),
    data,
    savedAt: Date.now()
  };
  try {
    sessionStorage.setItem(INTERVENTION_PRINT_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Could not save intervention print snapshot:', error);
  }
}

export function readInterventionPrintSnapshot(id?: string): PrintInterventionData | null {
  if (!id) return null;
  try {
    const raw = sessionStorage.getItem(INTERVENTION_PRINT_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InterventionPrintSnapshot;
    if (!parsed || String(parsed.id) !== String(id) || !parsed.data) return null;
    return parsed.data;
  } catch (error) {
    console.warn('Could not read intervention print snapshot:', error);
    return null;
  }
}

/** Prefer snapshot fields; fill empty text/arrays from API fallback. */
export function mergePrintInterventionData(
  primary: PrintInterventionData | null | undefined,
  fallback: PrintInterventionData
): PrintInterventionData {
  if (!primary) return fallback;

  const mergeText = (a: string, b: string) => (a && String(a).trim() ? a : b);

  const measurements = { ...fallback.measurements };
  MEASUREMENT_KEYS.forEach((key) => {
    const fromPrimary = padClimValues(primary.measurements?.[key]);
    const fromFallback = padClimValues(fallback.measurements?.[key]);
    measurements[key] = fromPrimary.map((value, index) => mergeText(value, fromFallback[index]));
  });

  const hasEquipment = (items: EquipmentItem[]) =>
    Array.isArray(items) && items.some((item) => item.description || item.quantity);

  return {
    ...fallback,
    client: mergeText(primary.client, fallback.client),
    site: mergeText(primary.site, fallback.site),
    date: mergeText(primary.date, fallback.date),
    location: mergeText(primary.location, fallback.location),
    arrivalTime: mergeText(primary.arrivalTime, fallback.arrivalTime),
    departureTime: mergeText(primary.departureTime, fallback.departureTime),
    machineNumber: mergeText(primary.machineNumber, fallback.machineNumber),
    brand: mergeText(primary.brand, fallback.brand),
    serialNumber: mergeText(primary.serialNumber, fallback.serialNumber),
    power: mergeText(primary.power, fallback.power),
    interventionObject: mergeText(primary.interventionObject, fallback.interventionObject),
    reason: mergeText(primary.reason, fallback.reason),
    jobNumber: mergeText(primary.jobNumber, fallback.jobNumber),
    sheetNumber: mergeText(primary.sheetNumber, fallback.sheetNumber),
    exteriorChecks: { ...fallback.exteriorChecks, ...primary.exteriorChecks },
    electricalTests: { ...fallback.electricalTests, ...primary.electricalTests },
    connections: { ...fallback.connections, ...primary.connections },
    controlBox: { ...fallback.controlBox, ...primary.controlBox },
    measurements,
    dismantledEquipment: padEquipment(
      hasEquipment(primary.dismantledEquipment) ? primary.dismantledEquipment : fallback.dismantledEquipment
    ),
    installedEquipment: padEquipment(
      hasEquipment(primary.installedEquipment) ? primary.installedEquipment : fallback.installedEquipment
    ),
    clientObservation: mergeText(primary.clientObservation, fallback.clientObservation),
    chanicObservation: mergeText(primary.chanicObservation, fallback.chanicObservation),
    clientSignature: mergeText(primary.clientSignature, fallback.clientSignature),
    chanicSignature: mergeText(primary.chanicSignature, fallback.chanicSignature)
  };
}
