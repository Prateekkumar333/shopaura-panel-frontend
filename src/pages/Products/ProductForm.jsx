import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../config/api';
import { FiArrowLeft, FiTrash2, FiImage } from 'react-icons/fi';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [existingThumbnail, setExistingThumbnail] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    discountPrice: '',
    category: '',
    subcategory: '',
    brand: '',
    stock: '',
    sku: '',
    tags: '',
    isFeatured: false,
  });

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await API.get('/categories', { params: { limit: 100 } });
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await API.get(`/products/${id}`);
      const product = response.data.product;
      setFormData({
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription || '',
        price: product.price,
        discountPrice: product.discountPrice || '',
        category: product.category?._id || '',
        subcategory: product.subcategory?._id || '',
        brand: product.brand || '',
        stock: product.stock,
        sku: product.sku || '',
        tags: product.tags?.join(', ') || '',
        isFeatured: product.isFeatured,
      });
      setExistingImages(product.images || []);
      setExistingThumbnail(product.thumbnail || null);
    } catch (error) {
      alert('Failed to fetch product');
      navigate('/dashboard/products');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle product images selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Max size is 5MB`);
        return false;
      }
      return true;
    });

    setImageFiles(validFiles);

    // Create previews
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // Handle thumbnail selection
  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Max size is 5MB');
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const removeImagePreview = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeThumbnailPreview = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const removeExistingImage = (index) => {
    if (window.confirm('Remove this existing image?')) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const removeExistingThumbnail = () => {
    if (window.confirm('Remove existing thumbnail?')) {
      setExistingThumbnail(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!isEdit && imageFiles.length === 0) {
      alert('Please select at least one product image');
      return;
    }

    if (isEdit && existingImages.length === 0 && imageFiles.length === 0) {
      alert('Product must have at least one image');
      return;
    }

    // Validate discount price
    if (formData.discountPrice && parseFloat(formData.discountPrice) >= parseFloat(formData.price)) {
      alert('Discount price must be less than regular price');
      return;
    }

    setLoading(true);

    try {
      // Create FormData
      const formDataToSend = new FormData();

      // Prepare product data
      const productData = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        isFeatured: formData.isFeatured,
        tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      };

      // Add optional fields only if they have values
      if (formData.discountPrice) {
        productData.discountPrice = parseFloat(formData.discountPrice);
      }
      if (formData.subcategory) {
        productData.subcategory = formData.subcategory;
      }
      if (formData.brand) {
        productData.brand = formData.brand;
      }
      if (formData.sku) {
        productData.sku = formData.sku;
      }

      // For edit mode, handle existing images
      if (isEdit) {
        if (existingImages.length > 0) {
          productData.keepExistingImages = true;
          productData.existingImages = existingImages;
        }
        if (existingThumbnail && !thumbnailFile) {
          productData.existingThumbnail = existingThumbnail;
        }
      }

      // Append data as JSON string
      formDataToSend.append('data', JSON.stringify(productData));

      // Append new image files
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      // Append thumbnail file
      if (thumbnailFile) {
        formDataToSend.append('thumbnail', thumbnailFile);
      }

      // Debug log
      console.log('Sending product data:', productData);
      console.log('Image files:', imageFiles.length);
      console.log('Thumbnail file:', thumbnailFile ? thumbnailFile.name : 'None');

      if (isEdit) {
        await API.put(`/products/${id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Product updated successfully');
      } else {
        await API.post('/products', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Product created successfully');
      }
      
      navigate('/dashboard/products');
    } catch (error) {
      console.error('Full error:', error);
      console.error('Response data:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Operation failed';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const mainCategories = categories.filter((cat) => cat.level === 0);
  const subcategories = categories.filter((cat) => cat.parent?._id === formData.category);

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/dashboard/products')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <FiArrowLeft />
        <span>Back to Products</span>
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">Basic Information</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Short Description
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                maxLength={300}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Brief description (max 300 characters)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Detailed product description"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">Pricing</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Discount Price
                </label>
                <input
                  type="number"
                  name="discountPrice"
                  value={formData.discountPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">Categories</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Category</option>
                  {mainCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subcategory
                </label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  disabled={!formData.category}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">Inventory</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="SKU-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Brand name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="electronics, gadget, new"
              />
            </div>
          </div>

          {/* Product Images */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">
              Product Images * (Max 5)
            </h2>

            {/* Existing Images (for edit mode) */}
            {isEdit && existingImages.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Existing Images</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {isEdit ? 'Add New Images' : 'Select Images'}
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiImage className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 5MB each, Max 5 files)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* New Image Previews */}
            {imagePreviews.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">New Images</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeImagePreview(index)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <FiTrash2 size={16} />
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {imageFiles[index].name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">
              Thumbnail (Optional)
            </h2>
            <p className="text-sm text-gray-600">
              If not set, the first product image will be used as thumbnail
            </p>

            {/* Existing Thumbnail */}
            {isEdit && existingThumbnail && !thumbnailPreview && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Current Thumbnail</p>
                <div className="relative inline-block">
                  <img
                    src={existingThumbnail.url}
                    alt="Existing Thumbnail"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeExistingThumbnail}
                    className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Thumbnail Upload */}
            {!thumbnailPreview && (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-48 h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center">
                    <FiImage className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="text-xs text-gray-500 text-center px-2">
                      Upload Thumbnail
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Thumbnail Preview */}
            {thumbnailPreview && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">New Thumbnail</p>
                <div className="relative inline-block">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={removeThumbnailPreview}
                    className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg"
                  >
                    <FiTrash2 size={16} />
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {thumbnailFile?.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="flex items-center bg-blue-50 rounded-lg p-4">
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-3 block text-sm font-semibold text-gray-700">
              Mark as Featured Product
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/dashboard/products')}
              className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                isEdit ? 'Update Product' : 'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
