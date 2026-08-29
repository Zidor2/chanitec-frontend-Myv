import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './interventionPage.scss';
import { Autocomplete, Button, Box, MenuItem, TextField } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import Layout from '../components/Layout/Layout';
import PrintBackgroundLogos from '../components/PrintBackgroundLogos/PrintBackgroundLogos';
import { apiService } from '../services/api-service';
import { Client, Site, Split } from '../models/Quote';
import SatisfactionRating from '../components/SatisfactionRating/SatisfactionRating';
import { employeeService, Employee } from '../services/employee-service';
import {
  mapInterventionFormToPrintData,
  saveInterventionPrintSnapshot
} from '../utils/mapInterventionFormToPrintData';

// Correct logo imports for React (public folder)
const logoChanic = process.env.PUBLIC_URL + '/CHANitec.png';
const logoTrane = process.env.PUBLIC_URL + '/Trane.png';

const emptyToNull = (value: string | null | undefined) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }
  return value;
};

const boolToTinyInt = (value: boolean) => (value ? 1 : 0);

const toDateInputValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const text = String(value).trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return '';
};

const toTimeInputValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const text = String(value).trim();
  const match = text.match(/(\d{2}:\d{2})/);
  return match ? match[1] : '';
};

const toCheckboxValue = (value: unknown, fallback: boolean): boolean => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value === true || value === 1 || value === '1';
};

const toTextValue = (value: unknown, fallback = ''): string => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value);
};

const machineLabel = (split: { name?: string; Code?: string } | null | undefined): string => {
  if (!split) return '';
  const name = String(split.name || '').trim();
  const code = String(split.Code || '').trim();
  if (name && code && name !== code) {
    return `${name} (${code})`;
  }
  return code || name;
};

const serialFromMachine = (
  split: { Code?: string } | null | undefined,
  machineNumber?: string
): string => {
  const code = String(split?.Code || '').trim();
  if (code) return code;
  const label = String(machineNumber || '').trim();
  const paren = label.match(/\(([^)]+)\)\s*$/);
  if (paren?.[1]) return paren[1].trim();
  return label;
};

const findSplitByValue = (
  list: Split[],
  value: unknown
): Split | undefined => {
  const v = String(value || '').trim();
  if (!v) return undefined;
  return list.find(
    (split) =>
      String(split.id) === v ||
      String(split.Code || '').trim() === v ||
      String(split.name || '').trim() === v ||
      machineLabel(split) === v
  );
};

interface InterventionRelatedRecordIds {
  uniteExterieureId: number | null;
  essaisElectriqueId: number | null;
  liaisonsElectriquesId: number | null;
  coffretElectriqueId: number | null;
  mesureReleveId: number | null;
}

const EMPTY_RELATED_RECORD_IDS: InterventionRelatedRecordIds = {
  uniteExterieureId: null,
  essaisElectriqueId: null,
  liaisonsElectriquesId: null,
  coffretElectriqueId: null,
  mesureReleveId: null
};

const parseTechnicianIds = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return parseTechnicianIds(parsed);
    } catch {
      return value
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item));
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return [value];
  }
  return [];
};

const matchTechnicians = (employeeList: Employee[], ids: number[], names: string[]): Employee[] => {
  const byId = employeeList.filter((employee) => ids.includes(employee.id));
  if (byId.length > 0) return byId;
  if (names.length === 0) return [];
  return employeeList.filter((employee) => names.includes(employee.full_name.trim().toLowerCase()));
};

interface InterventionPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  readOnly?: boolean;
}

export default function InterventionPage({
  currentPath = '/intervention',
  onNavigate,
  onLogout,
  readOnly = false
}: InterventionPageProps) {
  const { id } = useParams<{ id?: string }>();
  const interventionRef = useRef<HTMLDivElement>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [relatedRecordIds, setRelatedRecordIds] = useState<InterventionRelatedRecordIds>(EMPTY_RELATED_RECORD_IDS);
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedSplit, setSelectedSplit] = useState<Split | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<Employee[]>([]);
  const [technicianSelectionHint, setTechnicianSelectionHint] = useState<{ ids: number[]; names: string[] } | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const reasonOptions = [
    'Problème',
    'Écoulement eau',
    'Bruit',
    'HS',
    'Pas de froid',
    'Autre'
  ];

  const interventionObjectOptions = ['DEPANNAGE', 'ENTRETIEN'];

  type MeasurementKey =
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

  interface Measurements {
    generalVoltage: string[];
    generalCurrent: string[];
    compressorCurrent: string[];
    condenserFanCurrent: string[];
    evaporatorFanCurrent: string[];
    highPressure: string[];
    lowPressure: string[];
    supplyAirTemp: string[];
    roomTemp: string[];
    supplyAirFlow: string[];
  }

  interface FormDataState {
    jobNumber: string;
    sheetNumber: string;
    date: string;
    location: string;
    serialNumber: string;
    power: string;
    arrivalTime: string;
    departureTime: string;
    client: string;
    site: string;
    machineNumber: string;
    brand: string;
    interventionObject: string;
    reason: string;
    exteriorChecks: {
      overheating: boolean;
      vibration: boolean;
      electricalConnections: boolean;
      electricalWiring: boolean;
      condenserCleaning: boolean;
      exteriorUnitVerification: boolean;
      speedDriveVerification: boolean;
    };
    measurements: Measurements;
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
    dismantledEquipment: { description: string; quantity: string }[];
    installedEquipment: { description: string; quantity: string }[];
    clientObservation: string;
    chanicObservation: string;
    clientSignature: string;
    chanicSignature: string;
  }

  // State for form data
  const [formData, setFormData] = useState<FormDataState>({
    jobNumber: '',
    sheetNumber: '',
    date: '',
    location: '',
    serialNumber: '',
    power: '',
    arrivalTime: '',
    departureTime: '',
    client: '',
    site: '',
    machineNumber: '',
    brand: '',
    interventionObject: '',
    reason: '',
    // Exterior unit checks
    exteriorChecks: {
      overheating: false,
      vibration: false,
      electricalConnections: false,
      electricalWiring: false,
      condenserCleaning: false,
      exteriorUnitVerification: false,
      speedDriveVerification: false
    },
    // Measurements
    measurements: {
      generalVoltage: [''],
      generalCurrent: [''],
      compressorCurrent: [''],
      condenserFanCurrent: [''],
      evaporatorFanCurrent: [''],
      highPressure: [''],
      lowPressure: [''],
      supplyAirTemp: [''],
      roomTemp: [''],
      supplyAirFlow: ['']
    },
    // Electrical tests
    electricalTests: {
      lowPressureSafety: false,
      highPressureSafety: false,
      forcedOperation: false,
      faultSwitchover: false
    },
    // Connections
    connections: {
      refrigerationCircuitFixation: false,
      refrigerationCircuitInsulation: false,
      electricalCircuitFixation: false
    },
    // Control box
    controlBox: {
      cleaning: false,
      electricalConnections: false,
      fuses: false,
      indicators: false,
      timer: false
    },
    // Equipment
    dismantledEquipment: [{ description: '', quantity: '' }],
    installedEquipment: [{ description: '', quantity: '' }],
    // Observations
    clientObservation: '',
    chanicObservation: '',
    // Signatures
    clientSignature: '',
    chanicSignature: ''
  });

  useEffect(() => {
    if (!readOnly || !pageContainerRef.current) {
      return;
    }

    const elements = pageContainerRef.current.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement
    >('input, textarea, select, button');

    elements.forEach((el) => {
      if (el instanceof HTMLButtonElement) {
        if (el.dataset.printButton === 'true') {
          el.disabled = false;
        } else {
          el.disabled = true;
        }
      } else {
        el.disabled = true;
      }
    });
  }, [readOnly]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientList = await apiService.getClients();
        setClients(clientList);
      } catch (error) {
        console.error('Error loading clients for intervention page:', error);
      }
    };

    loadClients();
  }, []);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const list = await employeeService.getAllEmployees();
        setEmployees(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('Error loading employees for intervention page:', error);
        setEmployees([]);
      }
    };

    loadEmployees();
  }, []);

  useEffect(() => {
    const loadSites = async () => {
      if (!selectedClient) {
        setSites([]);
        setSelectedSite(null);
        return;
      }

      try {
        const clientSites = await apiService.getSitesByClientId(selectedClient.id);
        setSites(clientSites);
      } catch (error) {
        console.error('Error loading sites for selected client:', error);
        setSites([]);
      }
    };

    loadSites();
  }, [selectedClient]);

  useEffect(() => {
    const loadSplits = async () => {
      if (!selectedSite) {
        setSplits([]);
        return;
      }

      try {
        const siteSplits = await apiService.getSplitsBySiteId(selectedSite.id);
        setSplits(siteSplits);
      } catch (error) {
        console.error('Error loading splits for selected site:', error);
        setSplits([]);
      }
    };

    loadSplits();
  }, [selectedSite]);

  useEffect(() => {
    if (!selectedSite || !splits.length || !formData.machineNumber || selectedSplit) {
      return;
    }

    const matchingSplit = findSplitByValue(splits, formData.machineNumber);

    if (matchingSplit) {
      setSelectedSplit(matchingSplit);
      setFormData((prev) => ({
        ...prev,
        machineNumber: machineLabel(matchingSplit) || prev.machineNumber,
        serialNumber: serialFromMachine(matchingSplit, prev.machineNumber),
        brand: matchingSplit.description || prev.brand,
        power:
          matchingSplit.puissance !== undefined && matchingSplit.puissance !== null
            ? String(matchingSplit.puissance)
            : prev.power
      }));
    }
  }, [selectedSite, selectedSplit, splits, formData.machineNumber]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadIntervention = async () => {
      try {
        const intervention = await apiService.getInterventionById(id);
        if (!intervention) {
          return;
        }

        setFormData(prev => ({
          ...prev,
          date: toDateInputValue(intervention.intervention_date) || prev.date,
          arrivalTime: toTimeInputValue(intervention.heure_arrive) || prev.arrivalTime,
          departureTime: toTimeInputValue(intervention.heure_depart) || prev.departureTime,
          interventionObject: toTextValue(intervention.object, prev.interventionObject),
          reason: toTextValue(intervention.raison, prev.reason),
          jobNumber: toTextValue(intervention.job_number, prev.jobNumber),
          sheetNumber: toTextValue(intervention.sheet_number, prev.sheetNumber),
          client: intervention.client_id || prev.client,
          site: intervention.site_id || prev.site,
          machineNumber: toTextValue(intervention.machine_number, prev.machineNumber),
          brand: toTextValue(intervention.brand, prev.brand),
          power: toTextValue(intervention.power, prev.power),
          location: toTextValue(intervention.location, prev.location),
          serialNumber: toTextValue(intervention.serial_number || intervention.serialNumber, prev.serialNumber)
        }));

        if (intervention.client_id) {
          const existingClient = clients.find(c => String(c.id) === String(intervention.client_id));
          if (existingClient) {
            setSelectedClient(existingClient);
          }
        }

        if (intervention.site_id) {
          try {
            const site = await apiService.getSiteById(intervention.site_id);
            setSelectedSite(site);
          } catch (error) {
            console.error('Error loading intervention site:', error);
            setSelectedSite({ id: intervention.site_id, name: '', client_id: intervention.client_id } as any);
          }
        }

        const loadOptional = async (loader: () => Promise<any>) => {
          try {
            return await loader();
          } catch (error) {
            console.warn('Optional intervention resource load failed:', error);
            return null;
          }
        };

        const [uniteExterieure, essaisElectrique, liaisonsElectriques, coffretElectrique, mesureReleve, observations] = await Promise.all([
          loadOptional(() => apiService.getInterventionUniteExterieureByInterventionId(id)),
          loadOptional(() => apiService.getInterventionEssaisElectriqueByInterventionId(id)),
          loadOptional(() => apiService.getInterventionLiaisonsElectriquesByInterventionId(id)),
          loadOptional(() => apiService.getInterventionCoffretElectriqueByInterventionId(id)),
          loadOptional(() => apiService.getInterventionMesureReleveByInterventionId(id)),
          loadOptional(() => apiService.getInterventionObservationsByInterventionId(id))
        ]);

        setRelatedRecordIds({
          uniteExterieureId: uniteExterieure?.unite_exterieure_id ?? null,
          essaisElectriqueId: essaisElectrique?.essais_id ?? null,
          liaisonsElectriquesId: liaisonsElectriques?.liaisons_id ?? null,
          coffretElectriqueId: coffretElectrique?.coffret_electrique_id ?? null,
          mesureReleveId: mesureReleve?.mesure_releve_id ?? null
        });

        setFormData(prev => ({
          ...prev,
          exteriorChecks: {
            overheating: toCheckboxValue(uniteExterieure?.absence_echauffement, prev.exteriorChecks.overheating),
            vibration: toCheckboxValue(uniteExterieure?.absence_vibration, prev.exteriorChecks.vibration),
            electricalConnections: toCheckboxValue(uniteExterieure?.serrage_connexions_electriques, prev.exteriorChecks.electricalConnections),
            electricalWiring: toCheckboxValue(uniteExterieure?.depoussierage_cablage_electrique, prev.exteriorChecks.electricalWiring),
            condenserCleaning: toCheckboxValue(uniteExterieure?.nettoyage_condenseur_eau_produit_detergent, prev.exteriorChecks.condenserCleaning),
            exteriorUnitVerification: toCheckboxValue(uniteExterieure?.verification_unite_exterieure, prev.exteriorChecks.exteriorUnitVerification),
            speedDriveVerification: toCheckboxValue(uniteExterieure?.verification_fonctionnement_variateur_vitesse, prev.exteriorChecks.speedDriveVerification)
          },
          electricalTests: {
            lowPressureSafety: toCheckboxValue(essaisElectrique?.essai_securite_bp, prev.electricalTests.lowPressureSafety),
            highPressureSafety: toCheckboxValue(essaisElectrique?.essai_securite_hp, prev.electricalTests.highPressureSafety),
            forcedOperation: toCheckboxValue(essaisElectrique?.essai_marche_forcee_cas_ht, prev.electricalTests.forcedOperation),
            faultSwitchover: toCheckboxValue(essaisElectrique?.essai_basculement_cas_defaut, prev.electricalTests.faultSwitchover)
          },
          connections: {
            refrigerationCircuitFixation: toCheckboxValue(liaisonsElectriques?.verification_fixation_circuits_frigorifiques, prev.connections.refrigerationCircuitFixation),
            refrigerationCircuitInsulation: toCheckboxValue(liaisonsElectriques?.verification_calorifuge_circuits_frigorifiques, prev.connections.refrigerationCircuitInsulation),
            electricalCircuitFixation: toCheckboxValue(liaisonsElectriques?.verification_fixation_circuits_electriques, prev.connections.electricalCircuitFixation)
          },
          controlBox: {
            cleaning: toCheckboxValue(coffretElectrique?.nettoyage_depoussierage_coffret_electrique, prev.controlBox.cleaning),
            electricalConnections: toCheckboxValue(coffretElectrique?.serrage_connexions_electriques, prev.controlBox.electricalConnections),
            fuses: toCheckboxValue(coffretElectrique?.etat_fusibles_coffret_puissance, prev.controlBox.fuses),
            indicators: toCheckboxValue(coffretElectrique?.etat_voyants_fonctionnement_sirene, prev.controlBox.indicators),
            timer: toCheckboxValue(coffretElectrique?.verification_fonctionnement_minuterie, prev.controlBox.timer)
          },
          measurements: {
            generalVoltage: [toTextValue(mesureReleve?.tension_generale_climatiseur, prev.measurements.generalVoltage[0])],
            generalCurrent: [toTextValue(mesureReleve?.intensite_generale_climatiseur, prev.measurements.generalCurrent[0])],
            compressorCurrent: [toTextValue(mesureReleve?.intensite_compresseur, prev.measurements.compressorCurrent[0])],
            condenserFanCurrent: [toTextValue(mesureReleve?.intensite_moteurs_ventilateurs_cond, prev.measurements.condenserFanCurrent[0])],
            evaporatorFanCurrent: [toTextValue(mesureReleve?.intensite_moteurs_ventilateurs_evap, prev.measurements.evaporatorFanCurrent[0])],
            highPressure: [toTextValue(mesureReleve?.haute_pression_hp, prev.measurements.highPressure[0])],
            lowPressure: [toTextValue(mesureReleve?.basse_pression_bp, prev.measurements.lowPressure[0])],
            supplyAirTemp: [toTextValue(mesureReleve?.temperature_soufflage, prev.measurements.supplyAirTemp[0])],
            roomTemp: [toTextValue(mesureReleve?.temperature_local, prev.measurements.roomTemp[0])],
            supplyAirFlow: [toTextValue(mesureReleve?.debit_air_soufflage, prev.measurements.supplyAirFlow[0])]
          },
          machineNumber: prev.machineNumber || toTextValue(mesureReleve?.split_code || mesureReleve?.split_id),
          serialNumber: prev.serialNumber || serialFromMachine(null, toTextValue(mesureReleve?.split_code)),
          clientObservation: toTextValue(observations?.observations_client, prev.clientObservation),
          chanicObservation: toTextValue(observations?.observations_chanic, prev.chanicObservation),
          clientSignature: toTextValue(observations?.signature_client, prev.clientSignature),
          chanicSignature: toTextValue(observations?.signature_chanic, prev.chanicSignature)
        }));

        const parsedIds = parseTechnicianIds(observations?.technician_employee_ids);
        const signatureNames = String(observations?.signature_chanic || '')
          .split(',')
          .map((name: string) => name.trim().toLowerCase())
          .filter(Boolean);
        setTechnicianSelectionHint({ ids: parsedIds, names: signatureNames });
      } catch (error) {
        console.error('Error loading intervention:', error);
      }
    };

    loadIntervention();
  }, [id, clients]);

  useEffect(() => {
    if (!id) {
      setSelectedTechnicians([]);
      setTechnicianSelectionHint(null);
      setRelatedRecordIds(EMPTY_RELATED_RECORD_IDS);
    }
  }, [id]);

  useEffect(() => {
    if (!employees.length || !technicianSelectionHint) {
      return;
    }
    setSelectedTechnicians(matchTechnicians(
      employees,
      technicianSelectionHint.ids,
      technicianSelectionHint.names
    ));
  }, [employees, technicianSelectionHint]);

  const [climCount, setClimCount] = useState(1);

  const handlePrint = () => {
    if (id && onNavigate) {
      const printSnapshot = mapInterventionFormToPrintData(formData, {
        clientName: selectedClient?.name || '',
        siteName: selectedSite?.name || ''
      });
      saveInterventionPrintSnapshot(String(id), printSnapshot);
      onNavigate(`/intervention/${id}/print`);
      return;
    }

    if (!interventionRef.current) return;

    (async () => {
      const element = interventionRef.current;
      if (!element) return;

      element.classList.add('is-pdf-mode');

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          width: element.offsetWidth,
          height: element.offsetHeight,
          windowWidth: element.offsetWidth,
          windowHeight: element.offsetHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const printWindow = window.open('', '_blank');

        if (printWindow) {
          printWindow.document.write(`<!DOCTYPE html><html><head><title>Print</title><style>
            html, body { margin: 0; padding: 0; }
            body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            img { width: 100%; height: auto; display: block; }
            @page { size: A4 landscape; margin: 0; }
          </style></head><body><img src="${imgData}" alt="Intervention print" /></body></html>`);
          printWindow.document.close();
          printWindow.focus();
          printWindow.onload = () => {
            printWindow.print();
            // keep the window open until user handles print
          };
        }
      } catch (error) {
        console.error('Error printing intervention:', error);
      } finally {
        element.classList.remove('is-pdf-mode');
      }
    })();
  };

  const measurementLabels: { label: string; key: MeasurementKey }[] = [
    { label: 'Tension générale climatiseur', key: 'generalVoltage' },
    { label: 'Intensité générale climatiseur', key: 'generalCurrent' },
    { label: 'Intensité compresseur', key: 'compressorCurrent' },
    { label: 'Intensité moteurs ventilateurs cond', key: 'condenserFanCurrent' },
    { label: 'Intensité moteurs ventilateurs evap', key: 'evaporatorFanCurrent' },
    { label: 'Haute pression (HP)', key: 'highPressure' },
    { label: 'Basse pression (BP)', key: 'lowPressure' },
    { label: 'Température de soufflage', key: 'supplyAirTemp' },
    { label: 'Température du local', key: 'roomTemp' },
    { label: 'Débit d\'air de soufflage', key: 'supplyAirFlow' }
  ];

  const updateMeasurementValue = (key: MeasurementKey, index: number, value: string) => {
    setFormData(prev => {
      const currentArray = prev.measurements[key] || [];
      const updatedArray = [...currentArray];
      updatedArray[index] = value;
      return {
        ...prev,
        measurements: {
          ...prev.measurements,
          [key]: updatedArray
        }
      };
    });
  };

  const addClimColumn = () => {
    setClimCount(prevCount => {
      const nextCount = prevCount + 1;
      setFormData(prev => {
        const measurements = { ...prev.measurements };
        (Object.keys(measurements) as MeasurementKey[]).forEach((measurementKey) => {
          measurements[measurementKey] = [...measurements[measurementKey], ''];
        });
        return { ...prev, measurements };
      });
      return nextCount;
    });
  };

  const handleDownloadPDF = async () => {
    if (!interventionRef.current) return;

    const element = interventionRef.current;
    element.classList.add('is-pdf-mode');

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        width: element.offsetWidth,
        height: element.offsetHeight,
        windowWidth: element.offsetWidth,
        windowHeight: element.offsetHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // A4 dimensions in mm
      const pageWidth = 297;
      const pageHeight = 210;

      // Calculate scaling to fit the page
      const imgRatio = canvas.width / canvas.height;
      const pageRatio = pageWidth / pageHeight;

      let finalWidth, finalHeight;

      if (imgRatio > pageRatio) {
        // Image is wider than page ratio
        finalWidth = pageWidth;
        finalHeight = pageWidth / imgRatio;
      } else {
        // Image is taller than page ratio
        finalHeight = pageHeight;
        finalWidth = pageHeight * imgRatio;
      }

      // Center the content
      const xOffset = (pageWidth - finalWidth) / 2;
      const yOffset = (pageHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      pdf.save('fiche-intervention.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      element.classList.remove('is-pdf-mode');
    }
  };

  const handleSaveIntervention = async () => {
    setSaveStatus(null);
    setIsSaving(true);

    if (!formData.date) {
      setSaveStatus('Erreur de sauvegarde : la date d\'intervention est obligatoire.');
      setIsSaving(false);
      return;
    }

    const payload = {
      intervention_date: formData.date,
      heure_arrive: emptyToNull(formData.arrivalTime),
      heure_depart: emptyToNull(formData.departureTime),
      object: emptyToNull(formData.interventionObject),
      raison: emptyToNull(formData.reason),
      quote_id: null,
      client_id: selectedClient?.id || emptyToNull(formData.client),
      site_id: selectedSite?.id || emptyToNull(formData.site)
    };

    const uniteExterieurePayload = {
      absence_echauffement: boolToTinyInt(formData.exteriorChecks.overheating),
      absence_vibration: boolToTinyInt(formData.exteriorChecks.vibration),
      serrage_connexions_electriques: boolToTinyInt(formData.exteriorChecks.electricalConnections),
      depoussierage_cablage_electrique: boolToTinyInt(formData.exteriorChecks.electricalWiring),
      nettoyage_condenseur_eau_produit_detergent: boolToTinyInt(formData.exteriorChecks.condenserCleaning),
      verification_unite_exterieure: boolToTinyInt(formData.exteriorChecks.exteriorUnitVerification),
      verification_fonctionnement_variateur_vitesse: boolToTinyInt(formData.exteriorChecks.speedDriveVerification)
    };

    const essaisElectriquePayload = {
      essai_securite_bp: boolToTinyInt(formData.electricalTests.lowPressureSafety),
      essai_securite_hp: boolToTinyInt(formData.electricalTests.highPressureSafety),
      essai_marche_forcee_cas_ht: boolToTinyInt(formData.electricalTests.forcedOperation),
      essai_basculement_cas_defaut: boolToTinyInt(formData.electricalTests.faultSwitchover)
    };

    const liaisonsElectriquesPayload = {
      verification_fixation_circuits_frigorifiques: boolToTinyInt(formData.connections.refrigerationCircuitFixation),
      verification_calorifuge_circuits_frigorifiques: boolToTinyInt(formData.connections.refrigerationCircuitInsulation),
      verification_fixation_circuits_electriques: boolToTinyInt(formData.connections.electricalCircuitFixation)
    };

    const coffretElectriquePayload = {
      nettoyage_depoussierage_coffret_electrique: boolToTinyInt(formData.controlBox.cleaning),
      serrage_connexions_electriques: boolToTinyInt(formData.controlBox.electricalConnections),
      etat_fusibles_coffret_puissance: boolToTinyInt(formData.controlBox.fuses),
      etat_voyants_fonctionnement_sirene: boolToTinyInt(formData.controlBox.indicators),
      verification_fonctionnement_minuterie: boolToTinyInt(formData.controlBox.timer)
    };

    try {
      const savedIntervention = id
        ? await apiService.updateIntervention(id, payload)
        : await apiService.saveIntervention(payload);

      const interventionId = savedIntervention?.intervention_id || id;

      if (interventionId) {
        if (relatedRecordIds.uniteExterieureId) {
          await apiService.updateInterventionUniteExterieure(relatedRecordIds.uniteExterieureId, uniteExterieurePayload);
        } else {
          await apiService.createInterventionUniteExterieure(interventionId, uniteExterieurePayload);
        }

        if (relatedRecordIds.essaisElectriqueId) {
          await apiService.updateInterventionEssaisElectrique(relatedRecordIds.essaisElectriqueId, essaisElectriquePayload);
        } else {
          await apiService.createInterventionEssaisElectrique(interventionId, essaisElectriquePayload);
        }

        if (relatedRecordIds.liaisonsElectriquesId) {
          await apiService.updateInterventionLiaisonsElectriques(relatedRecordIds.liaisonsElectriquesId, liaisonsElectriquesPayload);
        } else {
          await apiService.createInterventionLiaisonsElectriques(interventionId, liaisonsElectriquesPayload);
        }

        if (relatedRecordIds.coffretElectriqueId) {
          await apiService.updateInterventionCoffretElectrique(relatedRecordIds.coffretElectriqueId, coffretElectriquePayload);
        } else {
          await apiService.createInterventionCoffretElectrique(interventionId, coffretElectriquePayload);
        }

        const mesureRelevePayload = {
          split_code: selectedSplit?.Code ?? selectedSplit?.name ?? emptyToNull(formData.machineNumber),
          general_voltage: emptyToNull(formData.measurements.generalVoltage[0]),
          general_current: emptyToNull(formData.measurements.generalCurrent[0]),
          compressor_current: emptyToNull(formData.measurements.compressorCurrent[0]),
          condenser_fan_current: emptyToNull(formData.measurements.condenserFanCurrent[0]),
          evaporator_fan_current: emptyToNull(formData.measurements.evaporatorFanCurrent[0]),
          high_pressure: emptyToNull(formData.measurements.highPressure[0]),
          low_pressure: emptyToNull(formData.measurements.lowPressure[0]),
          supply_air_temp: emptyToNull(formData.measurements.supplyAirTemp[0]),
          room_temp: emptyToNull(formData.measurements.roomTemp[0]),
          supply_air_flow: emptyToNull(formData.measurements.supplyAirFlow[0])
        };

        if (relatedRecordIds.mesureReleveId) {
          await apiService.updateInterventionMesureReleve(relatedRecordIds.mesureReleveId, mesureRelevePayload);
        } else {
          await apiService.createInterventionMesureReleve(interventionId, {
            intervention_id: interventionId,
            ...mesureRelevePayload
          });
        }

        await apiService.saveInterventionObservations(interventionId, {
          observations_client: formData.clientObservation,
          observations_chanic: formData.chanicObservation,
          signature_client: formData.clientSignature,
          signature_chanic: formData.chanicSignature,
          technician_employee_ids: JSON.stringify(selectedTechnicians.map((employee) => employee.id))
        });
      }

      setSaveStatus('Intervention enregistrée avec succès.');
    } catch (error) {
      console.error('Error saving intervention:', error);
      const message = error instanceof Error ? error.message : 'inconnue';
      setSaveStatus(`Erreur de sauvegarde : ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewIntervention = () => {
    if (onNavigate) {
      onNavigate('/intervention/new');
    }
  };

  const selectedMachineLabel =
    machineLabel(findSplitByValue(splits, formData.machineNumber)) || formData.machineNumber;

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <Box className={`intervention-page${readOnly ? ' print-only' : ''}`} ref={pageContainerRef}>
        <Box className="intervention-header">
          <Box className="nav-buttons">
            {!readOnly && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewIntervention}
                className="nav-button"
              >
                Nouvelle intervention
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              className="nav-button"
              data-print-button="true"
            >
              Imprimer
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
              className="nav-button"
              data-print-button="true"
            >
              Télécharger PDF
            </Button>
            {!readOnly && (
              <Button
                variant="contained"
                color="success"
                onClick={handleSaveIntervention}
                disabled={isSaving}
                className="nav-button"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            )}
          </Box>
          {saveStatus && (
            <Box className="save-status-message" sx={{ mt: 1 }}>
              {saveStatus}
            </Box>
          )}
        </Box>

        <div ref={interventionRef} className="intervention-a4-container">
          <PrintBackgroundLogos />

          {/* Header Section */}
          <div className="intervention-header-logos">
            <img src={logoChanic} alt="GROUPE CHANIC" className="logo-chanic" />
            <div className="center-section">
              <div className="title-section">
                <h1>ENTRETIEN DEPANNAGE</h1>
                <div className="title-row">
                  <h2>FICHE DE JOB N°</h2>
                  <input
                      type="text"
                      value={formData.sheetNumber}
                      onChange={(e) => setFormData({...formData, sheetNumber: e.target.value})}
                      className="form-input fiche-input-header"
                      placeholder="..."
                    />
                  <div className="fiche-header">
                    <label className="fiche-label">N° Feuillet</label>
                    <input
                      type="text"
                      value={formData.sheetNumber}
                      onChange={(e) => setFormData({...formData, sheetNumber: e.target.value})}
                      className="form-input fiche-input-header"
                      placeholder="..."
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="right-section">
              <div className="division-info">
                <div className="division-text">Division Climatisation</div>
              </div>
              <img src={logoTrane} alt="TRANE" className="logo-trane" />
            </div>
          </div>

          {/* Top Information Grid */}
          <div className="form-top-info">
            <div className="info-row-main">
              <div className="info-label">CLIENT</div>
              <Autocomplete
                options={clients}
                getOptionLabel={(option) => option.name}
                value={selectedClient}
                onChange={(_, value) => {
                  setSelectedClient(value);
                  setSelectedSplit(null);
                  setFormData({
                    ...formData,
                    client: value ? value.name : '',
                    site: '',
                    machineNumber: '',
                    serialNumber: ''
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Rechercher un client"
                    size="small"
                    className="form-input"
                  />
                )}
              />
            </div>
            <div className="info-row">
              <div className="info-label">DATE</div>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="info-row">
              <div className="info-label">LOCAL/PIECE</div>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="info-row">
              <div className="info-label">HEURE ARRIVEE</div>
              <input
                type="time"
                value={formData.arrivalTime}
                onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="info-row">
              <div className="info-label">HEURE DEPART</div>
              <input
                type="time"
                value={formData.departureTime}
                onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-second-row">
            <div className="info-row-main">
              <div className="info-label">SITE</div>
              <Autocomplete
                options={sites}
                getOptionLabel={(option) => option.name}
                value={selectedSite}
                onChange={(_, value) => {
                  setSelectedSite(value);
                  setSelectedSplit(null);
                  setFormData({
                    ...formData,
                    site: value ? value.name : '',
                    machineNumber: '',
                    serialNumber: ''
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Sélectionner un site"
                    size="small"
                    className="form-input"
                    disabled={!selectedClient}
                  />
                )}
              />
            </div>
            <div className="info-row">
              <div className="info-label">N° MACHINE</div>
              <TextField
                select
                value={selectedMachineLabel}
                onChange={(e) => {
                  const chosenSplit = findSplitByValue(splits, e.target.value) || null;
                  setSelectedSplit(chosenSplit);
                  setFormData({
                    ...formData,
                    machineNumber: chosenSplit ? machineLabel(chosenSplit) : e.target.value,
                    serialNumber: serialFromMachine(chosenSplit, e.target.value),
                    brand: chosenSplit?.description || '',
                    power: chosenSplit?.puissance !== undefined && chosenSplit?.puissance !== null
                      ? String(chosenSplit.puissance)
                      : ''
                  });
                }}
                className="form-input"
                size="small"
                disabled={!selectedSite || splits.length === 0}
              >
                <MenuItem value="">Sélectionnez une machine</MenuItem>
                {splits.map((split) => (
                  <MenuItem key={split.id ?? split.Code} value={machineLabel(split)}>
                    {machineLabel(split)}
                  </MenuItem>
                ))}
              </TextField>
            </div>
            <div className="info-row">
              <div className="info-label">MARQUE</div>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="info-row">
              <div className="info-label">N° SERIE</div>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="info-row">
              <div className="info-label">P(KW)/BTU</div>
              <input
                type="text"
                value={formData.power}
                onChange={(e) => setFormData({...formData, power: e.target.value})}
                className="form-input"
              />
            </div>
          </div>

          {/* Intervention Object Section */}
          <div className="intervention-object-section">
            <div className="intervention-col">
              <div className="section-header">OBJET INTERVENTION</div>
              <select
                value={formData.interventionObject}
                onChange={(e) => setFormData({ ...formData, interventionObject: e.target.value })}
                className="form-input reason-input"
              >
                <option value="" disabled>
                  Choisir un objet
                </option>
                {interventionObjectOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="intervention-col large">
              <div className="section-header">RAISON</div>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="form-input reason-input"
              >
                <option value="" disabled>
                  Choisir une raison
                </option>
                {reasonOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {/* CLIM checkbox columns removed as requested */}
          </div>

          {/* Exterior Unit Section */}
          <div className="unite-coffret-combined-table">
            <div className="unite-coffret-header-main">UNITE EXTERIEURE</div>
            <div className="unite-coffret-header-section">V</div>

            <div className="unite-coffret-label">Absence échauffement</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.exteriorChecks.overheating}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    exteriorChecks: {
                      ...formData.exteriorChecks,
                      overheating: e.target.checked
                    }
                  })
                }
              />
            </div>

            <div className="unite-coffret-label">Absence vibration</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.exteriorChecks.vibration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    exteriorChecks: {
                      ...formData.exteriorChecks,
                      vibration: e.target.checked
                    }
                  })
                }
              />
            </div>

            <div className="unite-coffret-label">Serrage des connexions électriques</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.exteriorChecks.electricalConnections}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    exteriorChecks: {
                      ...formData.exteriorChecks,
                      electricalConnections: e.target.checked
                    }
                  })
                }
              />
            </div>

            <div className="unite-coffret-label">Dépoussiérage câblage électrique</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.exteriorChecks.electricalWiring}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    exteriorChecks: {
                      ...formData.exteriorChecks,
                      electricalWiring: e.target.checked
                    }
                  })
                }
              />
            </div>

            <div className="unite-coffret-label">Nettoyage du condenseur (Eau & Produit détergent)</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.exteriorChecks.condenserCleaning}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    exteriorChecks: {
                      ...formData.exteriorChecks,
                      condenserCleaning: e.target.checked
                    }
                  })
                }
              />
            </div>

            <div className="unite-coffret-label">Vérification de l'unité extérieure</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.exteriorChecks.exteriorUnitVerification}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    exteriorChecks: {
                      ...formData.exteriorChecks,
                      exteriorUnitVerification: e.target.checked
                    }
                  })
                }
              />
            </div>

            <div className="unite-coffret-label">Vérification fonctionnement du variateur de vitesse</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.exteriorChecks.speedDriveVerification}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    exteriorChecks: {
                      ...formData.exteriorChecks,
                      speedDriveVerification: e.target.checked
                    }
                  })
                }
              />
            </div>
          </div>

          {/* Measurements and Tests */}
          <div
            className="mesure-essais-combined-table"
            style={{ gridTemplateColumns: `2.5fr repeat(${climCount}, 1fr)` }}
          >
            <div className="mesure-essais-header-main">
              <span className="mesure-essais-title">MESURE ET RELEVE</span>
            </div>
            {Array.from({ length: climCount }, (_, index) => (
              <div className="mesure-essais-header-clim" key={`header-clim-${index}`}>
                <span>{`CLIM ${index + 1}`}</span>
                {index === climCount - 1 && (
                  <button
                    type="button"
                    className="mesure-essais-add-clim-button"
                    onClick={addClimColumn}
                  >
                    +
                  </button>
                )}
              </div>
            ))}

            {measurementLabels.map(label => (
              <React.Fragment key={label.key}>
                <div className="mesure-essais-label">{label.label}</div>
                {Array.from({ length: climCount }, (_, index) => (
                  <div className="mesure-essais-cell" key={`${label.key}-${index}`}>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.measurements[label.key][index] ?? ''}
                      onChange={(e) => updateMeasurementValue(label.key, index, e.target.value)}
                    />
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Electrical Tests */}
          <div className="unite-coffret-combined-table">
            <div className="unite-coffret-header-main">ESSAIS ELECTRIQUE & FRIGORIFIQUE</div>
            <div className="unite-coffret-header-section">V</div>

            <div className="unite-coffret-label">Essai de la sécurité BP</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.electricalTests.lowPressureSafety}
                onChange={(e) => setFormData({
                  ...formData,
                  electricalTests: {
                    ...formData.electricalTests,
                    lowPressureSafety: e.target.checked
                  }
                })}
              />
            </div>

            <div className="unite-coffret-label">Essai de la sécurité HP</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.electricalTests.highPressureSafety}
                onChange={(e) => setFormData({
                  ...formData,
                  electricalTests: {
                    ...formData.electricalTests,
                    highPressureSafety: e.target.checked
                  }
                })}
              />
            </div>

            <div className="unite-coffret-label">Essai Marche forcée en cas HT°</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.electricalTests.forcedOperation}
                onChange={(e) => setFormData({
                  ...formData,
                  electricalTests: {
                    ...formData.electricalTests,
                    forcedOperation: e.target.checked
                  }
                })}
              />
            </div>

            <div className="unite-coffret-label">Essai du basculement en cas de défaut</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.electricalTests.faultSwitchover}
                onChange={(e) => setFormData({
                  ...formData,
                  electricalTests: {
                    ...formData.electricalTests,
                    faultSwitchover: e.target.checked
                  }
                })}
              />
            </div>
          </div>

          {/* Connections */}
          <div className="interieure-liaisons-combined-table">
            <div className="interieure-liaisons-header-main">LIAISONS ELECTRIQUES ET FRIGORIFIQUES</div>
            <div className="interieure-liaisons-header-section">V</div>

            <div className="interieure-liaisons-label">Vérification fixation des circuits frigorifiques</div>
            <div className="interieure-liaisons-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.connections.refrigerationCircuitFixation}
                onChange={(e) => setFormData({
                  ...formData,
                  connections: {
                    ...formData.connections,
                    refrigerationCircuitFixation: e.target.checked
                  }
                })}
              />
            </div>

            <div className="interieure-liaisons-label">Vérification calorifuge des circuits frigorifiques</div>
            <div className="interieure-liaisons-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.connections.refrigerationCircuitInsulation}
                onChange={(e) => setFormData({
                  ...formData,
                  connections: {
                    ...formData.connections,
                    refrigerationCircuitInsulation: e.target.checked
                  }
                })}
              />
            </div>

            <div className="interieure-liaisons-label">Vérification fixation des circuits électriques</div>
            <div className="interieure-liaisons-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.connections.electricalCircuitFixation}
                onChange={(e) => setFormData({
                  ...formData,
                  connections: {
                    ...formData.connections,
                    electricalCircuitFixation: e.target.checked
                  }
                })}
              />
            </div>
          </div>

          {/* Control Box */}
          <div className="unite-coffret-combined-table">
            <div className="unite-coffret-header-main">COFFRET ELECTRIQUE COMMANDE & PUISSANCE</div>
            <div className="unite-coffret-header-section">V</div>

            <div className="unite-coffret-label">Nettoyage & Dépoussiérage coffret électrique</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.controlBox.cleaning}
                onChange={(e) => setFormData({
                  ...formData,
                  controlBox: {
                    ...formData.controlBox,
                    cleaning: e.target.checked
                  }
                })}
              />
            </div>

            <div className="unite-coffret-label">Serrage des connexions électriques</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.controlBox.electricalConnections}
                onChange={(e) => setFormData({
                  ...formData,
                  controlBox: {
                    ...formData.controlBox,
                    electricalConnections: e.target.checked
                  }
                })}
              />
            </div>

            <div className="unite-coffret-label">Etat des fusibles coffret de puissance</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.controlBox.fuses}
                onChange={(e) => setFormData({
                  ...formData,
                  controlBox: {
                    ...formData.controlBox,
                    fuses: e.target.checked
                  }
                })}
              />
            </div>

            <div className="unite-coffret-label">Etat des voyants & fonctionnement sirène</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.controlBox.indicators}
                onChange={(e) => setFormData({
                  ...formData,
                  controlBox: {
                    ...formData.controlBox,
                    indicators: e.target.checked
                  }
                })}
              />
            </div>

            <div className="unite-coffret-label">Vérification fonctionnement minuterie</div>
            <div className="unite-coffret-cell">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.controlBox.timer}
                onChange={(e) => setFormData({
                  ...formData,
                  controlBox: {
                    ...formData.controlBox,
                    timer: e.target.checked
                  }
                })}
              />
            </div>
          </div>

          {/* Equipment Sections */}
          <div className="equipment-sections">
            <div className="equipment-section">
              <h3>EQUIPEMENTS DEMONTES</h3>
              <div className="equipment-table">
                <div className="equipment-header">DESCRIPTION</div>
                <div className="equipment-header">QTE</div>
                {formData.dismantledEquipment.map((item, index) => (
                  <React.Fragment key={index}>
                    <div className="equipment-cell">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const newEquipment = [...formData.dismantledEquipment];
                          newEquipment[index] = {...item, description: e.target.value};
                          setFormData({...formData, dismantledEquipment: newEquipment});
                        }}
                        className="form-input"
                      />
                    </div>
                    <div className="equipment-cell">
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => {
                          const newEquipment = [...formData.dismantledEquipment];
                          newEquipment[index] = {...item, quantity: e.target.value};
                          setFormData({...formData, dismantledEquipment: newEquipment});
                        }}
                        className="form-input"
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="equipment-section">
              <h3>EQUIPEMENTS INSTALLES</h3>
              <div className="equipment-table">
                <div className="equipment-header">DESCRIPTION</div>
                <div className="equipment-header">QTE</div>
                {formData.installedEquipment.map((item, index) => (
                  <React.Fragment key={index}>
                    <div className="equipment-cell">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const newEquipment = [...formData.installedEquipment];
                          newEquipment[index] = {...item, description: e.target.value};
                          setFormData({...formData, installedEquipment: newEquipment});
                        }}
                        className="form-input"
                      />
                    </div>
                    <div className="equipment-cell">
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => {
                          const newEquipment = [...formData.installedEquipment];
                          newEquipment[index] = {...item, quantity: e.target.value};
                          setFormData({...formData, installedEquipment: newEquipment});
                        }}
                        className="form-input"
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Observations */}
          <div className="compte-observations-table">
            <div className="compte-observations-header">OBSERVATIONS CLIENT</div>
            <div className="compte-observations-header">OBSERVATIONS CHANIC</div>

            <div className="compte-observations-cell">
              <SatisfactionRating
                ariaLabel="Satisfaction client"
                value={formData.clientObservation}
                onChange={(score) => setFormData({ ...formData, clientObservation: score ? String(score) : '' })}
              />
            </div>

            <div className="compte-observations-cell">
              <SatisfactionRating
                ariaLabel="Satisfaction Chanic"
                value={formData.chanicObservation}
                onChange={(score) => setFormData({ ...formData, chanicObservation: score ? String(score) : '' })}
              />
            </div>
          </div>

          {/* Signatures */}
          <div className="signatures-table">
            <div className="signatures-header">CLIENT: nom, prénom et signature</div>
            <div className="signatures-header">CHANIC: nom, prénom et signature DES TECHNICIENS</div>
            <div className="signatures-cell">
              <input
                type="text"
                value={formData.clientSignature}
                onChange={(e) => setFormData({...formData, clientSignature: e.target.value})}
                className="signatures-input"
              />
            </div>
            <div className="signatures-cell">
              <Autocomplete
                multiple
                options={employees}
                value={selectedTechnicians}
                disabled={readOnly}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option.full_name || ''}
                filterOptions={(options, state) => {
                  const query = state.inputValue.trim().toLowerCase();
                  if (!query) return options;
                  return options.filter((employee) =>
                    [employee.full_name, employee.job_title, employee.fonction]
                      .filter(Boolean)
                      .some((field) => String(field).toLowerCase().includes(query))
                  );
                }}
                onChange={(_, value) => {
                  setSelectedTechnicians(value);
                  setFormData({
                    ...formData,
                    chanicSignature: value.map((employee) => employee.full_name).join(', ')
                  });
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.full_name}
                    {option.job_title ? ` — ${option.job_title}` : ''}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Rechercher un technicien"
                    size="small"
                    className="signatures-input"
                  />
                )}
              />
            </div>
          </div>
        </div>
      </Box>
    </Layout>
  );
}