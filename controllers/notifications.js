const nodemailer = require('nodemailer');
const { notifyUser} = require('../models/notification');

const userNotification = async (req, res) => {
    try {
      const { userId, content } = req.body;
  
      const notification = new notifyUser({
        user: userId,
        content,
      });
  
      await notification.save();
  
      res.json({ success: true, message: 'Notification sent successfully' });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};  

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await notifyUser.findById(id);
    console.log(notification)

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (notification.isRead) {
        return res.status(400).json({success: false, error: "Notification has already been marked"})
    }

    notification.isRead = true;

    await notification.save();

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = { userNotification, markNotificationAsRead };
