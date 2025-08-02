import React, { useState } from 'react';
import { useItems } from '../hooks/useItems';

export const ItemsList = () => {
    const { items, loading, error, createItem, updateItem, deleteItem } = useItems();
    const [newItemDescription, setNewItemDescription] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        try {
            if (!newItemDescription || !newItemPrice) {
                setFormError('Description and price are required');
                return;
            }

            const price = parseFloat(newItemPrice);
            if (isNaN(price) || price <= 0) {
                setFormError('Please enter a valid price');
                return;
            }

            await createItem({
                description: newItemDescription,
                price: price
            });

            // Clear form after successful creation
            setNewItemDescription('');
            setNewItemPrice('');
        } catch (err) {
            setFormError(err.message || 'Failed to create item');
            console.error('Failed to create item:', err);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Items List</h1>

            {/* Add Item Form */}
            <form onSubmit={handleSubmit} className="mb-6">
                <div className="flex flex-col gap-4">
                    {formError && (
                        <div className="text-red-500 text-sm">{formError}</div>
                    )}
                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={newItemDescription}
                            onChange={(e) => setNewItemDescription(e.target.value)}
                            placeholder="Item Description"
                            className="border p-2 rounded flex-1"
                            required
                        />
                        <input
                            type="number"
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(e.target.value)}
                            placeholder="Price"
                            className="border p-2 rounded w-32"
                            step="0.01"
                            min="0"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Item'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Items Table */}
            {loading && <div>Loading...</div>}
            {!loading && items.length === 0 ? (
                <div className="text-gray-500">No items found</div>
            ) : (
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="text-left p-4">Description</th>
                            <th className="text-left p-4">Price</th>
                            <th className="text-left p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-t">
                                <td className="p-4">{item.description}</td>
                                <td className="p-4">${item.price.toFixed(2)}</td>
                                <td className="p-4">
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 mr-2"
                                        disabled={loading}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};