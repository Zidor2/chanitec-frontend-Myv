import React, { useState } from 'react';
import { useClients } from '../hooks/useClients';

export const ClientList = () => {
    const { clients, loading, error, createClient } = useClients();
    const [formData, setFormData] = useState({
        clientName: '',
        siteName: '',
        siteAddress: ''
    });
    const [formError, setFormError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        try {
            if (!formData.clientName.trim()) {
                setFormError('Client name is required');
                return;
            }
            if (!formData.siteName.trim()) {
                setFormError('Site name is required');
                return;
            }
            if (!formData.siteAddress.trim()) {
                setFormError('Site address is required');
                return;
            }

            await createClient({
                name: formData.clientName.trim(),
                site: {
                    name: formData.siteName.trim(),
                    address: formData.siteAddress.trim()
                }
            });

            // Clear form after successful creation
            setFormData({
                clientName: '',
                siteName: '',
                siteAddress: ''
            });
        } catch (err) {
            setFormError(err.message || 'Failed to create client');
            console.error('Failed to create client:', err);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Clients List</h1>

            {/* Add Client Form */}
            <form onSubmit={handleSubmit} className="mb-6">
                <div className="flex flex-col gap-4">
                    {formError && (
                        <div className="text-red-500 text-sm">{formError}</div>
                    )}
                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Client Name
                            </label>
                            <input
                                type="text"
                                name="clientName"
                                value={formData.clientName}
                                onChange={handleChange}
                                placeholder="Client Name"
                                className="border p-2 rounded w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Site Name
                            </label>
                            <input
                                type="text"
                                name="siteName"
                                value={formData.siteName}
                                onChange={handleChange}
                                placeholder="Site Name"
                                className="border p-2 rounded w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Site Address
                            </label>
                            <input
                                type="text"
                                name="siteAddress"
                                value={formData.siteAddress}
                                onChange={handleChange}
                                placeholder="Site Address"
                                className="border p-2 rounded w-full"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Client with Site'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Clients Table */}
            {loading && <div>Loading...</div>}
            {!loading && clients.length === 0 ? (
                <div className="text-gray-500">No clients found</div>
            ) : (
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="text-left p-4">Client Name</th>
                            <th className="text-left p-4">Site Name</th>
                            <th className="text-left p-4">Site Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map((client) => (
                            <tr key={client.id} className="border-t">
                                <td className="p-4">{client.name}</td>
                                <td className="p-4">{client.site?.name || 'No site'}</td>
                                <td className="p-4">{client.site?.address || 'No address'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};