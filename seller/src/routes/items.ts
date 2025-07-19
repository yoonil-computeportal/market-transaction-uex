import { Router, Request, Response } from 'express';
import { sellerItems, getItemById, getItemsByCategory, searchItems } from '../data/items';
import { ApiResponse } from '../types';

const router = Router();

// GET /api/items - Get all items
router.get('/', (req: Request, res: Response) => {
  try {
    const { category, search, limit = '50', offset = '0' } = req.query;
    
    let filteredItems = [...sellerItems];
    
    // Filter by category
    if (category && typeof category === 'string') {
      filteredItems = getItemsByCategory(category);
    }
    
    // Search items
    if (search && typeof search === 'string') {
      filteredItems = searchItems(search);
    }
    
    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedItems = filteredItems.slice(offsetNum, offsetNum + limitNum);
    
    const response: ApiResponse<typeof paginatedItems> = {
      success: true,
      data: paginatedItems,
      message: `Retrieved ${paginatedItems.length} items`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve items',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/items/:id - Get item by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = getItemById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
        message: `Item with ID ${id} does not exist`
      });
    }
    
    const response: ApiResponse<typeof item> = {
      success: true,
      data: item,
      message: 'Item retrieved successfully'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get item by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve item',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/items/category/:category - Get items by category
router.get('/category/:category', (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const items = getItemsByCategory(category);
    
    const response: ApiResponse<typeof items> = {
      success: true,
      data: items,
      message: `Retrieved ${items.length} items in category ${category}`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get items by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve items by category',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/items/search/:query - Search items
router.get('/search/:query', (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const items = searchItems(query);
    
    const response: ApiResponse<typeof items> = {
      success: true,
      data: items,
      message: `Found ${items.length} items matching "${query}"`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search items',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/items/categories - Get all categories
router.get('/categories', (req: Request, res: Response) => {
  try {
    const categories = [...new Set(sellerItems.map(item => item.category))];
    
    const response: ApiResponse<typeof categories> = {
      success: true,
      data: categories,
      message: `Retrieved ${categories.length} categories`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 