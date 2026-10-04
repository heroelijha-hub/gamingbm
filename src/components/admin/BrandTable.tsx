'use client';

import { useState, useRef } from 'react';
import { updateBrand, deleteBrand, bulkDeleteBrands } from '@/actions/admin';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import Image from "next/image";

export default function BrandTable({ brands }: { brands: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const generateSlug = (text: string) => 
    text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');

  const handleEditClick = (b: any) => {
    setEditingId(b.id);
    setEditName(b.name);
    setEditSlug(b.slug || '');
    setEditLogoUrl(b.logo || '');
  };

  const handleRemoveEditLogo = () => {
    setEditLogoUrl('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    const formData = new FormData();
    formData.append('name', editName);
    formData.append('slug', editSlug);
    const res = await updateBrand(id, formData, editLogoUrl);
    if (res.error) alert(res.error);
    else setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette marque ?")) return;
    setIsDeleting(id);
    const res = await deleteBrand(id);
    if (res.error) alert(res.error);
    setIsDeleting(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Voulez-vous supprimer ces ${selectedIds.length} marques ?`)) {
      setIsBulkDeleting(true);
      const res = await bulkDeleteBrands(selectedIds);
      if (res.error) alert(res.error);
      else setSelectedIds([]);
      setIsBulkDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(selId => selId !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {selectedIds.length > 0 && (
        <div className="bg-orange-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-orange-800">
            {selectedIds.length} sélectionné(s)
          </span>
          <button onClick={handleBulkDelete} disabled={isBulkDeleting} className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition disabled:opacity-50">
            Supprimer la sélection
          </button>
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left w-12"><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? brands.map(b => b.id) : [])} checked={brands.length > 0 && selectedIds.length === brands.length} className="rounded border-gray-300 text-orange-700 focus:ring-orange-500"/></th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {brands.length === 0 ? (
            <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Aucune marque trouvée.</td></tr>
          ) : (
            brands.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap"><input type="checkbox" checked={selectedIds.includes(b.id)} onChange={() => toggleSelect(b.id)} className="rounded border-gray-300 text-orange-700 focus:ring-orange-500"/></td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === b.id ? (
                    <div className="flex items-center gap-2">
                      {/* Prévisualisation */}
                      {editLogoUrl ? (
                        <div className="relative w-9 h-9 flex-shrink-0">
                          <Image width={800} height={800} src={editLogoUrl} alt="logo" className="w-9 h-9 object-contain rounded border border-gray-200" />
                          <button
                            type="button"
                            onClick={handleRemoveEditLogo}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                          >×</button>
                        </div>
                      ) : (
                        <div className="w-9 h-9 border border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50">
                          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Bouton upload */}
                      <button
                        type="button"
                        onClick={() => setShowMediaPicker(true)}
                        className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 transition"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Changer
                      </button>

                      {showMediaPicker && (
                        <MediaPickerModal 
                          onClose={() => setShowMediaPicker(false)}
                          onSelect={(url) => {
                            setEditLogoUrl(url);
                            setShowMediaPicker(false);
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    b.logo ? <Image width={800} height={800} src={b.logo} alt={b.name} className="h-8 object-contain" /> : <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {editingId === b.id ? (
                    <input type="text" value={editName} onChange={(e) => { setEditName(e.target.value); setEditSlug(generateSlug(e.target.value)); }} className="px-2 py-1 border border-orange-300 rounded text-sm" autoFocus/>
                  ) : b.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingId === b.id ? (
                    <input type="text" value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className="px-2 py-1 border border-orange-300 rounded text-sm"/>
                  ) : b.slug}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === b.id ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700">Annuler</button>
                      <button onClick={() => handleSaveEdit(b.id)} className="text-blue-600 hover:text-blue-800">Enregistrer</button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleEditClick(b)} className="text-blue-600 hover:text-blue-800 transition">Modifier</button>
                      <button onClick={() => handleDelete(b.id)} disabled={isDeleting === b.id} className="text-red-600 hover:text-red-800 transition disabled:opacity-50">Supprimer</button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
