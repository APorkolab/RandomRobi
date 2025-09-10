const express = require('express');

const router = express.Router();
const authenticate = require('../../middlewares/authenticate');
const {
  getLastVideoLink,
  generateRandomLink,
  getAllLinksFromDatabase,
  addLinkToDatabase,
  updateLinkInDatabase,
  deleteLinkFromDatabase,
  getByIdFromDatabase,
  getCacheStats,
  clearCache
} = require('../../services/videoService');

/**
 * @swagger
 * /video:
 *   get:
 *     summary: Retrieve all video links from the database
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of video links
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   link:
 *                     type: string
 *                     example: "https://example.com/video1"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-09-01T12:34:56Z"
 *       500:
 *         description: Error retrieving video links
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error retrieving video links."
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const rows = await getAllLinksFromDatabase();
    res.send(rows);
  } catch (error) {
    console.error('Error retrieving video links:', error);
    res.status(500).send('Error retrieving video links');
  }
});

/**
 * @swagger
 * /video:
 *   post:
 *     summary: Add a new video link to the database
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               link:
 *                 type: string
 *                 example: "https://example.com/newvideo"
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-09-02T08:00:00Z"
 *     responses:
 *       201:
 *         description: New video link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 2
 *                 link:
 *                   type: string
 *                   example: "https://example.com/newvideo"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-09-02T08:00:00Z"
 *       500:
 *         description: Error creating video link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error creating video"
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { link, createdAt } = req.body;
    const newVideo = await addLinkToDatabase(link, createdAt);
    res.status(201).json(newVideo);
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Error creating video' });
  }
});

/**
 * @swagger
 * /video/daily:
 *   post:
 *     summary: Add a new daily video link to the database
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               link:
 *                 type: string
 *                 example: "https://example.com/newvideo"
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-09-02T08:00:00Z"
 *     responses:
 *       201:
 *         description: Video link added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Video link added successfully"
 *                 record:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     link:
 *                       type: string
 *                       example: "https://example.com/newvideo"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-09-02T08:00:00Z"
 *       500:
 *         description: Error adding video link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error adding video link."
 */
router.post('/daily', authenticate, async (req, res) => {
  try {
    const { link, createdAt } = req.body;
    const record = await addLinkToDatabase(link, createdAt);
    res.status(201).json({
      message: 'Video link added successfully',
      record
    });
  } catch (error) {
    console.error('Error adding video link:', error);
    res.status(500).send('Error adding video link');
  }
});

/**
 * @swagger
 * /video/{id}:
 *   put:
 *     summary: Update an existing video link in the database
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           example: 1
 *         required: true
 *         description: The ID of the video link to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               link:
 *                 type: string
 *                 example: "https://example.com/updatedvideo"
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-09-02T08:00:00Z"
 *     responses:
 *       200:
 *         description: Video link updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Video link updated successfully"
 *                 record:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     link:
 *                       type: string
 *                       example: "https://example.com/updatedvideo"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-09-02T08:00:00Z"
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Nem található videó ezzel az azonosítóval: {id}"
 *       500:
 *         description: Error updating video link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error updating video link."
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingVideo = await getByIdFromDatabase(id);
    if (!existingVideo) {
      return res.status(404).json({ error: `Nem található videó ezzel az azonosítóval: ${id}` });
    }
    const { link, createdAt } = req.body;
    const updatedVideo = { id, link, createdAt };
    const record = await updateLinkInDatabase(updatedVideo);
    if (!record) {
      return res.status(500).json({ error: 'A videó frissítése sikertelen volt' });
    }
    res.status(200).json({
      message: 'A videó link sikeresen frissítve',
      record
    });
  } catch (error) {
    console.error('Hiba a videó link frissítésekor:', error);
    res.status(500).json({ error: 'Hiba a videó link frissítésekor', details: error.message });
  }
});

/**
 * @swagger
 * /video/{id}:
 *   delete:
 *     summary: Delete a video link from the database
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           example: 1
 *         required: true
 *         description: The ID of the video link to delete
 *     responses:
 *       200:
 *         description: Video link deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "A {id} azonosítójú videó link törölve lett."
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Nem található videó ezzel az azonosítóval: {id}"
 *       500:
 *         description: Error deleting video link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error deleting video link."
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingVideo = await getByIdFromDatabase(id);
    if (!existingVideo) {
      return res.status(404).json({ error: `Nem található videó ezzel az azonosítóval: ${id}` });
    }
    await deleteLinkFromDatabase(id);
    res.status(200).json({
      message: `A ${id} azonosítójú videó link törölve lett.`
    });
  } catch (error) {
    console.error('Hiba a videó link törlésekor:', error);
    res.status(500).json({
      error: `Hiba a videó link törlésekor: ${error.message}`
    });
  }
});

/**
 * @swagger
 * /video/latest:
 *   get:
 *     summary: Retrieve the latest video link from the database
 *     tags: [Videos]
 *     responses:
 *       200:
 *         description: The latest video link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 link:
 *                   type: string
 *                   example: "https://example.com/latestvideo"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-09-02T08:00:00Z"
 *       500:
 *         description: Error retrieving the latest video link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error retrieving the latest video link."
 */
router.get('/latest', async (req, res) => {
  try {
    const row = await getLastVideoLink();
    res.json(row);
  } catch (error) {
    console.error('Error retrieving video link:', error);
    res.status(500).json('Error retrieving video link');
  }
});

/**
 * @swagger
 * /video/random:
 *   get:
 *     summary: Generate and retrieve a random video link
 *     tags: [Videos]
 *     responses:
 *       200:
 *         description: A random video link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 link:
 *                   type: string
 *                   example: "https://example.com/randomvideo"
 *       500:
 *         description: Error retrieving random video link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error retrieving random video link."
 */
router.get('/random', async (req, res) => {
  try {
    const row = await generateRandomLink();
    res.send(row);
  } catch (error) {
    console.error('Error retrieving random video link:', error);
    res.status(500).send('Error retrieving random video link');
  }
});

/**
 * @swagger
 * /video/{id}:
 *   get:
 *     summary: Retrieve a video link by ID from the database
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           example: 1
 *         required: true
 *         description: The ID of the video link to retrieve
 *     responses:
 *       200:
 *         description: The video link information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 link:
 *                   type: string
 *                   example: "https://example.com/video1"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-09-01T12:34:56Z"
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Nem található videó ezzel az azonosítóval: 1"
 *       500:
 *         description: Error retrieving video link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error retrieving video link"
 *                 details:
 *                   type: string
 *                   example: "Database connection error"
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const video = await getByIdFromDatabase(id);
    if (!video) {
      return res.status(404).json({ error: `Nem található videó ezzel az azonosítóval: ${id}` });
    }
    res.json(video);
  } catch (error) {
    console.error('Error retrieving video link:', error);
    res.status(500).json({ error: 'Error retrieving video link', details: error.message });
  }
});

/**
 * @swagger
 * /video/cache/stats:
 *   get:
 *     summary: Get cache statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics
 */
router.get('/cache/stats', authenticate, (req, res) => {
  try {
    const stats = getCacheStats();
    res.json({
      message: 'Cache statistics retrieved successfully',
      stats
    });
  } catch (error) {
    console.error('Error retrieving cache stats:', error);
    res.status(500).json({ error: 'Error retrieving cache statistics' });
  }
});

/**
 * @swagger
 * /video/cache/clear:
 *   post:
 *     summary: Clear all caches (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Caches cleared successfully
 */
router.post('/cache/clear', authenticate, (req, res) => {
  try {
    clearCache();
    res.json({
      message: 'All caches cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing caches:', error);
    res.status(500).json({ error: 'Error clearing caches' });
  }
});

module.exports = router;
