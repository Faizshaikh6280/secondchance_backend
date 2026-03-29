const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/community.controller');

router.get('/risk', auth, c.getRisk);
router.post('/risk/refresh', auth, c.refreshRisk);
router.get('/posts', auth, c.getPosts);
router.post('/posts', auth, c.createPost);
router.post('/posts/:id/like', auth, c.toggleLike);
router.post('/posts/:id/comment', auth, c.addComment);
router.delete('/posts/:id', auth, c.deletePost);
router.get('/groups', auth, c.getGroups);
router.post('/groups/:id/join', auth, c.joinGroup);
router.post('/groups/:id/leave', auth, c.leaveGroup);
router.get('/circle', auth, c.getCircle);

module.exports = router;
