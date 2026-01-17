'use client';

import React, { useState } from 'react';
import { Category } from '../types/calendar';

interface CategoryManagerProps {
  categories: Category[];
  onUpdateCategory: (id: string, updates: { name: string }) => Promise<Category>;
  onClose: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories: categoriesProp,
  onUpdateCategory,
  onClose,
}) => {
  // Use categories prop directly to ensure we get updates
  const categories = categoriesProp;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sort categories by ID to maintain consistent order
  // Only show regular categories (category-1 through category-8), exclude schedule category
  const allCategories = [...categories]
    .filter(cat => {
      // Only include category-1 through category-8
      const match = cat.id.match(/^category-(\d+)$/);
      if (!match) return false;
      const num = parseInt(match[1]);
      return num >= 1 && num <= 8;
    })
    .sort((a, b) => {
      const aNum = parseInt(a.id.replace('category-', '') || '0');
      const bNum = parseInt(b.id.replace('category-', '') || '0');
      return aNum - bNum;
    });

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    if (!editingName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    try {
      await onUpdateCategory(editingId, {
        name: editingName.trim(),
      });
      // Force a re-render by clearing edit state
      setEditingId(null);
      setEditingName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  return (
    <div className="category-manager-modal" onClick={onClose}>
      <div className="category-manager-content" onClick={(e) => e.stopPropagation()}>
        <div className="category-manager-header">
          <h2>Manage Categories</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="form-error-message" style={{ margin: '1rem', padding: '0.75rem', background: '#fee', color: '#c33', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <div className="category-manager-body">
          {/* All Categories */}
          <div className="category-section">
            <h3>Categories</h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1rem' }}>
              You can edit category names. Colors are fixed and cannot be changed.
            </p>
            <div className="category-list">
              {allCategories.map(category => (
                <div key={category.id} className="category-item">
                  {editingId === category.id ? (
                    <div className="category-edit-form">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="form-input"
                        style={{ flex: 1 }}
                        placeholder="Category name"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          }
                        }}
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="category-display">
                      <div
                        className="category-color-preview"
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: category.color,
                          border: '1px solid var(--border-light)',
                        }}
                        title="Color is fixed and cannot be changed"
                      />
                      <span className="category-name">{category.name}</span>
                      <button
                        onClick={() => handleStartEdit(category)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        Edit Name
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="category-manager-footer" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;

