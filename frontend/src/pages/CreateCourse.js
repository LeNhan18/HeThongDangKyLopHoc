import React, { useState } from 'react';

export default function CreateCourseForm({ onCourseCreated, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Xóa error khi user bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

  // Xử lý chọn file ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Kiểm tra định dạng file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          image: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)'
        }));
        return;
      }
      
      // Kiểm tra kích thước file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Kích thước file không được vượt quá 5MB'
        }));
        return;
      }
      
      setSelectedFile(file);
      
      // Tạo preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setFormData(prev => ({
          ...prev,
          image: file.name // Lưu tên file
        }));
      };
      reader.readAsDataURL(file);
      
      // Xóa error nếu có
      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: ''
        }));
      }
    }
  };

  // Xóa ảnh đã chọn
  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
    // Reset input file
    const fileInput = document.getElementById('image');
    if (fileInput) fileInput.value = '';
  };
  };

  // Validation form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên khóa học không được để trống';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Tên khóa học phải có ít nhất 3 ký tự';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả không được để trống';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Mô tả phải có ít nhất 10 ký tự';
    }
    
    if (!formData.image.trim()) {
      newErrors.image = 'URL hình ảnh không được để trống';
    } else if (!isValidUrl(formData.image)) {
      newErrors.image = 'URL hình ảnh không hợp lệ';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Kiểm tra URL hợp lệ
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Gọi API tạo khóa học
      const response = await fetch('http://localhost:8000/courses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Reset form
      setFormData({ name: '', description: '', image: '' });
      setImagePreview('');
      setErrors({});
      
      // Callback khi tạo thành công
      if (onCourseCreated) {
        onCourseCreated(result);
      }
      
      alert('Tạo khóa học thành công!');
      
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Có lỗi xảy ra khi tạo khóa học. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({ name: '', description: '', image: '' });
    setErrors({});
    setImagePreview('');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Tạo Khóa Học Mới</h2>
      
      <div onSubmit={handleSubmit} className="space-y-6">
        {/* Tên khóa học */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Tên khóa học *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập tên khóa học..."
            maxLength={100}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Mô tả */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập mô tả khóa học..."
            maxLength={500}
          />
          <div className="flex justify-between mt-1">
            <div>
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {formData.description.length}/500
            </p>
          </div>
        </div>

        {/* URL hình ảnh */}
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
            URL hình ảnh *
          </label>
          <input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.image ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://example.com/image.jpg"
          />
          {errors.image && (
            <p className="mt-1 text-sm text-red-600">{errors.image}</p>
          )}
          
          {/* Preview hình ảnh */}
          {imagePreview && !errors.image && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-md border"
                onError={() => setImagePreview('')}
              />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Đang tạo...' : 'Tạo khóa học'}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Hủy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}