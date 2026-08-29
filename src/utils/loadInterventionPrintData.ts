import { apiService } from '../services/api-service';
import {
  EMPTY_PRINT_INTERVENTION_DATA,
  EquipmentItem,
  MeasurementKey,
  PrintInterventionData
} from '../types/interventionPrint';

const MEASUREMENT_FIELDS: { key: MeasurementKey; names: string[] }[] = [
  { key: 'generalVoltage', names: ['tension_generale_climatiseur', 'general_voltage'] },
  { key: 'generalCurrent', names: ['intensite_generale_climatiseur', 'general_current'] },
  { key: 'compressorCurrent', names: ['intensite_compresseur', 'compressor_current'] },
  { key: 'condenserFanCurrent', names: ['intensite_moteurs_ventilateurs_cond', 'condenser_fan_current'] },
  { key: 'evaporatorFanCurrent', names: ['intensite_moteurs_ventilateurs_evap', 'evaporator_fan_current'] },
  { key: 'highPressure', names: ['haute_pression_hp', 'high_pressure'] },
  { key: 'lowPressure', names: ['basse_pression_bp', 'low_pressure'] },
  { key: 'supplyAirTemp', names: ['temperature_soufflage', 'supply_air_temp'] },
  { key: 'roomTemp', names: ['temperature_local', 'room_temp'] },
  { key: 'supplyAirFlow', names: ['debit_air_soufflage', 'supply_air_flow'] }
];

function asRecord(value: unknown): Record<string, any> {
  if (Array.isArray(value)) {
    return value.length ? asRecord(value[0]) : {};
  }
  return value && typeof value === 'object' ? (value as Record<string, any>) : {};
}

function pick(source: Record<string, any>, ...keys: string[]): any {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
  }
  return '';
}

function toBool(value: any): boolean {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer?.(value)) {
    return value.length > 0 && value[0] === 1;
  }
  return value === true || value === 1 || value === '1' || value === 'true';
}

function toText(value: any): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

function formatDate(value: string): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
}

function formatTime(value: string): string {
  if (!value) return '';
  return value.slice(0, 5);
}

function padEquipment(items: EquipmentItem[]): EquipmentItem[] {
  const next = items.length ? [...items] : [];
  while (next.length < 4) {
    next.push({ description: '', quantity: '' });
  }
  return next.slice(0, Math.max(4, next.length));
}

function parseEquipment(value: unknown): EquipmentItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item);
    return {
      description: toText(pick(record, 'description', 'libelle', 'name')),
      quantity: toText(pick(record, 'quantity', 'qte', 'qty'))
    };
  });
}

function emptyClimValues(): string[] {
  return ['', '', '', ''];
}

function measurementsFromApi(mesureReleve: unknown): Record<MeasurementKey, string[]> {
  const rows = Array.isArray(mesureReleve)
    ? mesureReleve.map(asRecord)
    : mesureReleve
      ? [asRecord(mesureReleve)]
      : [];

  const measurements = { ...EMPTY_PRINT_INTERVENTION_DATA.measurements };
  MEASUREMENT_FIELDS.forEach(({ key }) => {
    measurements[key] = emptyClimValues();
  });

  rows.slice(0, 4).forEach((row, index) => {
    MEASUREMENT_FIELDS.forEach(({ key, names }) => {
      measurements[key][index] = toText(pick(row, ...names));
    });
  });

  return measurements;
}

export async function loadInterventionPrintData(id: string): Promise<PrintInterventionData> {
  const intervention = asRecord(await apiService.getInterventionById(id));
  if (!intervention || Object.keys(intervention).length === 0) {
    return EMPTY_PRINT_INTERVENTION_DATA;
  }

  const loadOptional = async (loader: () => Promise<any>) => {
    try {
      return await loader();
    } catch (error) {
      console.warn('Optional intervention resource load failed:', error);
      return null;
    }
  };

  const [uniteExterieure, essaisElectrique, liaisonsElectriques, coffretElectrique, mesureReleve, observations, clients] =
    await Promise.all([
      loadOptional(() => apiService.getInterventionUniteExterieureByInterventionId(id)),
      loadOptional(() => apiService.getInterventionEssaisElectriqueByInterventionId(id)),
      loadOptional(() => apiService.getInterventionLiaisonsElectriquesByInterventionId(id)),
      loadOptional(() => apiService.getInterventionCoffretElectriqueByInterventionId(id)),
      loadOptional(() => apiService.getInterventionMesureReleveByInterventionId(id)),
      loadOptional(() => apiService.getInterventionObservationsByInterventionId(id)),
      loadOptional(() => apiService.getClients())
    ]);

  const unite = asRecord(uniteExterieure);
  const essais = asRecord(essaisElectrique);
  const liaisons = asRecord(liaisonsElectriques);
  const coffret = asRecord(coffretElectrique);
  const mesure = asRecord(mesureReleve);
  const nestedClient = asRecord(intervention.client);
  const nestedSite = asRecord(intervention.site);

  let clientName = toText(pick(intervention, 'client_name', 'clientName'));
  if (!clientName && typeof intervention.client === 'string') {
    clientName = intervention.client;
  }
  if (!clientName && nestedClient.name) {
    clientName = toText(nestedClient.name);
  }
  if (!clientName && intervention.client_id && Array.isArray(clients)) {
    const match = clients.find((client: any) => String(client.id) === String(intervention.client_id));
    clientName = match?.name || '';
  }

  let siteName = toText(pick(intervention, 'site_name', 'siteName'));
  if (!siteName && typeof intervention.site === 'string') {
    siteName = intervention.site;
  }
  if (!siteName && nestedSite.name) {
    siteName = toText(nestedSite.name);
  }

  if (!siteName && intervention.site_id) {
    try {
      const site = asRecord(await apiService.getSiteById(String(intervention.site_id)));
      siteName = toText(site.name);
    } catch (error) {
      console.warn('Could not load site for print intervention:', error);
    }
  }

  const savedMachineNumber = toText(
    pick(intervention, 'machine_number', 'machineNumber', 'split_code') ||
      mesure.split_code ||
      mesure.split_id
  );

  let machineNumber = savedMachineNumber;
  let brand = toText(pick(intervention, 'brand', 'marque'));
  let power = toText(pick(intervention, 'power', 'puissance'));
  let serialNumber = toText(pick(intervention, 'serial_number', 'serialNumber', 'split_code') || mesure.split_code);

  if (intervention.site_id && savedMachineNumber) {
    try {
      const splits = await apiService.getSplitsBySiteId(String(intervention.site_id));
      if (Array.isArray(splits)) {
        const match = splits.find((split: any) => {
          const name = String(split.name || '').trim();
          const code = String(split.Code || '').trim();
          const label = name && code && name !== code ? `${name} (${code})` : (code || name);
          return (
            String(split.id) === String(savedMachineNumber) ||
            code === String(savedMachineNumber) ||
            name === String(savedMachineNumber) ||
            label === String(savedMachineNumber)
          );
        });
        if (match) {
          const name = String(match.name || '').trim();
          const code = String(match.Code || '').trim();
          machineNumber = name && code && name !== code ? `${name} (${code})` : (code || name || savedMachineNumber);
          if (!brand) brand = toText(match.description || match.brand || match.marque);
          if (!power && match.puissance !== undefined && match.puissance !== null) {
            power = String(match.puissance);
          }
          serialNumber = code || serialNumber;
        }
      }
    } catch (error) {
      console.warn('Could not enrich print data from splits:', error);
    }
  }

  if (!serialNumber) {
    const paren = machineNumber.match(/\(([^)]+)\)\s*$/);
    serialNumber = paren?.[1]?.trim() || machineNumber;
  }

  return {
    ...EMPTY_PRINT_INTERVENTION_DATA,
    client: clientName,
    site: siteName,
    date: formatDate(toText(pick(intervention, 'intervention_date', 'date'))),
    location: toText(pick(intervention, 'location', 'local', 'piece')),
    arrivalTime: formatTime(toText(pick(intervention, 'heure_arrive', 'arrivalTime'))),
    departureTime: formatTime(toText(pick(intervention, 'heure_depart', 'departureTime'))),
    machineNumber,
    brand,
    serialNumber,
    power,
    interventionObject: toText(pick(intervention, 'object', 'interventionObject')),
    reason: toText(pick(intervention, 'raison', 'reason')),
    jobNumber: toText(pick(intervention, 'job_number', 'jobNumber')),
    sheetNumber: toText(pick(intervention, 'sheet_number', 'sheetNumber')),
    exteriorChecks: {
      overheating: toBool(unite.absence_echauffement),
      vibration: toBool(unite.absence_vibration),
      electricalConnections: toBool(unite.serrage_connexions_electriques),
      electricalWiring: toBool(unite.depoussierage_cablage_electrique),
      condenserCleaning: toBool(unite.nettoyage_condenseur_eau_produit_detergent),
      exteriorUnitVerification: toBool(unite.verification_unite_exterieure),
      speedDriveVerification: toBool(unite.verification_fonctionnement_variateur_vitesse)
    },
    electricalTests: {
      lowPressureSafety: toBool(essais.essai_securite_bp),
      highPressureSafety: toBool(essais.essai_securite_hp),
      forcedOperation: toBool(essais.essai_marche_forcee_cas_ht ?? essais.essai_marche_forcee_ht),
      faultSwitchover: toBool(essais.essai_basculement_cas_defaut ?? essais.essai_basculement_defaut)
    },
    connections: {
      refrigerationCircuitFixation: toBool(liaisons.verification_fixation_circuits_frigorifiques),
      refrigerationCircuitInsulation: toBool(liaisons.verification_calorifuge_circuits_frigorifiques),
      electricalCircuitFixation: toBool(liaisons.verification_fixation_circuits_electriques)
    },
    controlBox: {
      cleaning: toBool(coffret.nettoyage_depoussierage_coffret_electrique),
      electricalConnections: toBool(coffret.serrage_connexions_electriques),
      fuses: toBool(coffret.etat_fusibles_coffret_puissance),
      indicators: toBool(coffret.etat_voyants_fonctionnement_sirene),
      timer: toBool(coffret.verification_fonctionnement_minuterie)
    },
    measurements: measurementsFromApi(mesureReleve),
    dismantledEquipment: padEquipment(
      parseEquipment(pick(intervention, 'dismantledEquipment', 'dismantled_equipment', 'equipements_demontes'))
    ),
    installedEquipment: padEquipment(
      parseEquipment(pick(intervention, 'installedEquipment', 'installed_equipment', 'equipements_installes'))
    ),
    clientObservation: toText(
      asRecord(observations).observations_client ||
        pick(intervention, 'clientObservation', 'observations_client', 'observation_client')
    ),
    chanicObservation: toText(
      asRecord(observations).observations_chanic ||
        pick(intervention, 'chanicObservation', 'observations_chanic', 'observation_chanic')
    ),
    clientSignature: toText(
      asRecord(observations).signature_client ||
        pick(intervention, 'clientSignature', 'client_signature', 'signature_client')
    ),
    chanicSignature: toText(
      asRecord(observations).signature_chanic ||
        pick(intervention, 'chanicSignature', 'chanic_signature', 'signature_chanic')
    )
  };
}
