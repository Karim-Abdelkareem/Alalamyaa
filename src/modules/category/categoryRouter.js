import express from 'express';
import Category from "./categoryModel.js";
import {
    getAllCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    updateCategoryOrder,
    toggleCategoryStatus
} from './categoryController.js';

const router = express.Router();

// Get all categories
router.get('/', getAllCategories);

// Get category by slug
router.get('/slug/:slug', getCategoryBySlug);

// Get category by ID
router.get('/:id', getCategoryById);

// Create new category
router.post('/', createCategory);

// Update category
router.put('/:id', updateCategory);

// Delete category
router.delete('/:id', deleteCategory);

// Update categories order
router.patch('/order', updateCategoryOrder);

// Toggle category status
router.patch('/:id/toggle-status', toggleCategoryStatus);

export default router;
