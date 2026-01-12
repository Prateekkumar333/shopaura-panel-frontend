import { useState, useEffect } from 'react';
import API from '../../config/api';
import { FiImage, FiTrash2 } from 'react-icons/fi';

const CategoryForm = ({ category, onSuccess, onCancel, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent: '',
    icon: '',
    order: 0,
    isFeatured: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parent: category.parent?._id || '',
        icon: category.icon || '',
        order: category.order || 0,
        isFeatured: category.isFeatured || false,
      });
      
      if (category.image?.url) {
        setExistingImage(category.image);
      }
    }
  }, [category]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    
    if (formData.name.length > 100) {
      newErrors.name = 'Category name cannot exceed 100 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File is too large. Max size is 2MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImagePreview = () => {
    setImageFile(null);
    setImagePreview(null);
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const removeExistingImage = () => {
    if (window.confirm('Remove existing image?')) {
      setExistingImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create FormData
      const formDataToSend = new FormData();

      // Append category data as JSON
      const categoryData = {
        ...formData,
        parent: formData.parent || null,
      };

      // For edit, include existing image info if no new image is selected
      if (category && existingImage && !imageFile) {
        categoryData.existingImage = existingImage;
      }

      formDataToSend.append('data', JSON.stringify(categoryData));

      // Append image file if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (category) {
        await API.put(`/categories/${category._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Category updated successfully');
      } else {
        await API.post('/categories', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Category created successfully');
      }
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const mainCategories = categories.filter((cat) => cat.level === 0);

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Category Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className={`w-full px-4 py-3 border ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
          placeholder="Enter category name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className={`w-full px-4 py-3 border ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
          placeholder="Enter category description"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Parent Category
        </label>
        <select
          name="parent"
          value={formData.parent}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="">Main Category (No Parent)</option>
          {mainCategories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Category Image */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Category Image
        </label>

        {/* Existing Image */}
        {category && existingImage && !imagePreview && (
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-2">Current Image</p>
            <div className="relative inline-block">
              <img
                src={existingImage.url}
                alt="Existing"
                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={removeExistingImage}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Image Upload */}
        {!imagePreview && (
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiImage className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> category image
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP (MAX. 2MB)</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div>
            <p className="text-xs text-gray-600 mb-2">New Image</p>
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg border-2 border-blue-500"
              />
              <button
                type="button"
                onClick={removeImagePreview}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
              >
                <FiTrash2 size={14} />
              </button>
              <p className="text-xs text-gray-600 mt-1 truncate max-w-24">
                {imageFile?.name}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Icon (CSS Class)
          </label>
          <input
            type="text"
            name="icon"
            value={formData.icon}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="fas fa-shopping-bag"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Display Order
          </label>
          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center bg-gray-50 rounded-lg p-4">
        <input
          type="checkbox"
          name="isFeatured"
          checked={formData.isFeatured}
          onChange={handleChange}
          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-3 block text-sm font-semibold text-gray-700">
          Mark as Featured Category
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            category ? 'Update Category' : 'Create Category'
          )}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
