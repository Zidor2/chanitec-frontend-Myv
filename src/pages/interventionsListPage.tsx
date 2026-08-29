import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { apiService } from '../services/api-service';
import { Autocomplete, TextField, Button, Box, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import './interventionsListPage.scss';

type SortField = 'created_at' | 'intervention_date' | 'intervention_id';
type SortDir = 'asc' | 'desc';

export default function InterventionsListPage({ currentPath = '/interventions', onNavigate, onLogout }: any) {
    const [clients, setClients] = useState<any[]>([]);
    const [sites, setSites] = useState<any[]>([]);
    const [sitesAll, setSitesAll] = useState<any[]>([]);
    const [splits, setSplits] = useState<any[]>([]);

    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [selectedSite, setSelectedSite] = useState<any | null>(null);
    const [selectedSplit, setSelectedSplit] = useState<any | null>(null);

    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [objectType, setObjectType] = useState<string>('');
    const [sortBy, setSortBy] = useState<SortField>('created_at');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const [interventions, setInterventions] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const c = await apiService.getClients();
                setClients(c);
                try {
                    const all = await apiService.getAllSites();
                    setSitesAll(all);
                } catch (e) {
                    console.warn('Could not load all sites for mapping', e);
                }
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const loadSites = async () => {
            if (!selectedClient) {
                setSites([]);
                setSelectedSite(null);
                return;
            }
            try {
                const s = await apiService.getSitesByClientId(selectedClient.id);
                setSites(s);
            } catch (err) {
                console.error(err);
            }
        };
        loadSites();
    }, [selectedClient]);

    useEffect(() => {
        const loadSplits = async () => {
            if (!selectedSite) {
                setSplits([]);
                setSelectedSplit(null);
                return;
            }
            try {
                const sp = await apiService.getSplitsBySiteId(selectedSite.id);
                setSplits(sp);
            } catch (err) {
                console.error(err);
            }
        };
        loadSplits();
    }, [selectedSite]);

    const fetchInterventions = async () => {
        try {
            const rows = await apiService.getInterventions({
                clientId: selectedClient?.id,
                siteId: selectedSite?.id,
                splitId: selectedSplit?.id,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                object: objectType || undefined
            });
            setInterventions(rows || []);
        } catch (err) {
            console.error('Error fetching interventions', err);
        }
    };

    const openNewIntervention = () => {
        if (!onNavigate) return;
        onNavigate('/intervention/new');
    };

    const openIntervention = (id: string | number) => {
        if (!onNavigate || id == null) return;
        onNavigate(`/intervention/${id}`);
    };

    useEffect(() => {
        const loadInterventions = async () => {
            try {
                const rows = await apiService.getInterventions({});
                setInterventions(rows || []);
            } catch (err) {
                console.error('Error fetching interventions', err);
            }
        };
        loadInterventions();
    }, []);

    const clearFilters = () => {
        setSelectedClient(null);
        setSelectedSite(null);
        setSelectedSplit(null);
        setDateFrom('');
        setDateTo('');
        setObjectType('');
    };

    const clientsMap = React.useMemo(() => {
        const m: Record<string, any> = {};
        clients.forEach(c => { m[String(c.id)] = c; });
        return m;
    }, [clients]);

    const sitesMap = React.useMemo(() => {
        const m: Record<string, any> = {};
        sitesAll.forEach(s => { m[String(s.id)] = s; });
        return m;
    }, [sitesAll]);

    const formatDateShort = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = d.getFullYear();
        return `${dd}/${mm}/${yy}`;
    };

    const formatDateTime = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yy} ${hh}:${min}`;
    };

    const getTimestamp = (value: string | null | undefined) => {
        if (!value) return 0;
        const time = new Date(value).getTime();
        return Number.isNaN(time) ? 0 : time;
    };

    const sortedInterventions = React.useMemo(() => {
        const rows = [...interventions];
        const direction = sortDir === 'asc' ? 1 : -1;

        rows.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'intervention_id') {
                comparison = Number(a.intervention_id) - Number(b.intervention_id);
            } else if (sortBy === 'intervention_date') {
                comparison = getTimestamp(a.intervention_date) - getTimestamp(b.intervention_date);
            } else {
                comparison = getTimestamp(a.created_at || a.createdAt) - getTimestamp(b.created_at || b.createdAt);
            }

            if (comparison === 0) {
                comparison = Number(a.intervention_id) - Number(b.intervention_id);
            }

            return comparison * direction;
        });

        return rows;
    }, [interventions, sortBy, sortDir]);

    const handleSortHeaderClick = (field: SortField) => {
        if (sortBy === field) {
            setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
            return;
        }
        setSortBy(field);
        setSortDir('desc');
    };

    const sortIndicator = (field: SortField) => {
        if (sortBy !== field) return '';
        return sortDir === 'asc' ? ' ↑' : ' ↓';
    };

    return (
        <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
            <Box className="interventions-list-page">
                <div className="interventions-list-header">
                    <h2>Liste des interventions</h2>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={openNewIntervention}
                    >
                        Nouvelle intervention
                    </Button>
                </div>

                <div className="filters">
                    <Autocomplete
                        options={clients}
                        getOptionLabel={(opt: any) => opt.name || ''}
                        value={selectedClient}
                        onChange={(_, v) => setSelectedClient(v)}
                        renderInput={(params) => <TextField {...params} label="Client" size="small" />}
                        style={{ width: 300 }}
                    />

                    <Autocomplete
                        options={sites}
                        getOptionLabel={(opt: any) => opt.name || ''}
                        value={selectedSite}
                        onChange={(_, v) => setSelectedSite(v)}
                        renderInput={(params) => <TextField {...params} label="Site" size="small" />}
                        style={{ width: 300 }}
                    />

                    <Autocomplete
                        options={splits}
                        getOptionLabel={(opt: any) => opt.name || opt.Code || ''}
                        value={selectedSplit}
                        onChange={(_, v) => setSelectedSplit(v)}
                        renderInput={(params) => <TextField {...params} label="Split / Machine" size="small" />}
                        style={{ width: 300 }}
                    />

                    <TextField label="Date from" type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                    <TextField label="Date to" type="date" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />

                    <TextField label="Type / Objet" size="small" value={objectType} onChange={(e) => setObjectType(e.target.value)} style={{ width: 200 }} />

                    <TextField
                        select
                        label="Trier par"
                        size="small"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortField)}
                        style={{ width: 200 }}
                    >
                        <MenuItem value="created_at">Date de création</MenuItem>
                        <MenuItem value="intervention_date">Date</MenuItem>
                        <MenuItem value="intervention_id">ID</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="Ordre"
                        size="small"
                        value={sortDir}
                        onChange={(e) => setSortDir(e.target.value as SortDir)}
                        style={{ width: 160 }}
                    >
                        <MenuItem value="desc">Décroissant</MenuItem>
                        <MenuItem value="asc">Croissant</MenuItem>
                    </TextField>

                    <div className="filter-actions">
                        <Button variant="contained" color="primary" onClick={fetchInterventions}>Appliquer</Button>
                        <Button variant="outlined" onClick={() => { clearFilters(); fetchInterventions(); }}>Réinitialiser</Button>
                    </div>
                </div>

                <div className="table-wrap">
                    <table className="interventions-table">
                        <thead>
                            <tr>
                                <th
                                    className={`sortable-th ${sortBy === 'intervention_id' ? 'is-active' : ''}`}
                                    onClick={() => handleSortHeaderClick('intervention_id')}
                                >
                                    ID{sortIndicator('intervention_id')}
                                </th>
                                <th
                                    className={`sortable-th ${sortBy === 'created_at' ? 'is-active' : ''}`}
                                    onClick={() => handleSortHeaderClick('created_at')}
                                >
                                    Date de création{sortIndicator('created_at')}
                                </th>
                                <th
                                    className={`sortable-th ${sortBy === 'intervention_date' ? 'is-active' : ''}`}
                                    onClick={() => handleSortHeaderClick('intervention_date')}
                                >
                                    Date{sortIndicator('intervention_date')}
                                </th>
                                <th>Client</th>
                                <th>Site</th>
                                <th>Objet</th>
                                <th>Raison</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedInterventions.map((it) => (
                                <tr key={it.intervention_id} className="clickable-row" onClick={() => openIntervention(it.intervention_id)}>
                                    <td>{it.intervention_id}</td>
                                    <td>{formatDateTime(it.created_at || it.createdAt)}</td>
                                    <td>{formatDateShort(it.intervention_date)}</td>
                                    <td>{clientsMap[String(it.client_id)]?.name || it.client_id}</td>
                                    <td>{sitesMap[String(it.site_id)]?.name || it.site_id}</td>
                                    <td>{it.object}</td>
                                    <td>{it.raison}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Box>
        </Layout>
    );
}
