const Inquiry = require('../models/Inquiry');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

// @desc    Submit a contact inquiry
// @route   POST /api/v1/site/contact
// @access  Public
exports.submitInquiry = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'Please provide all fields' });
        }

        const inquiry = await Inquiry.create({
            name,
            email,
            subject,
            message
        });

        res.status(201).json({
            success: true,
            data: inquiry,
            message: 'Inquiry submitted successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all inquiries
// @route   GET /api/v1/admin/inquiries
// @access  Private (Admin)
exports.getInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort('-createdAt');
        res.status(200).json({
            success: true,
            count: inquiries.length,
            data: inquiries
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update inquiry status
// @route   PUT /api/v1/admin/inquiries/:id
// @access  Private (Admin)
exports.updateInquiryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        let inquiry = await Inquiry.findById(req.params.id);

        if (!inquiry) {
            return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }

        inquiry.status = status;
        await inquiry.save();

        res.status(200).json({
            success: true,
            data: inquiry
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Reply to inquiry and send email/notification
// @route   POST /api/v1/admin/inquiries/:id/reply
// @access  Private (Admin)
exports.replyToInquiry = async (req, res) => {
    try {
        const { message } = req.body;
        const inquiry = await Inquiry.findById(req.params.id);

        if (!inquiry) {
            return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }

        // 1. Send Email
        try {
            await sendEmail({
                email: inquiry.email,
                subject: `Re: ${inquiry.subject} - Homedify Support`,
                message: message,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background-color: #f8fafc;">
                        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                            <div style="background-color: #FF6B6B; padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">Homedify <span style="font-weight: 300; opacity: 0.8;">Support</span></h1>
                            </div>
                            <div style="padding: 40px;">
                                <p style="font-size: 16px; font-weight: 600; margin-bottom: 24px;">Hi ${inquiry.name},</p>
                                <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 30px;">Thank you for reaching out to us. Our support team has reviewed your inquiry regarding "<strong>${inquiry.subject}</strong>" and has provided the following response:</p>
                                
                                <div style="background: #fff5f5; padding: 25px; border-left: 4px solid #FF6B6B; border-radius: 12px; margin-bottom: 30px;">
                                    <p style="font-style: italic; color: #475569; margin: 0; font-size: 15px; line-height: 1.7;">"${message}"</p>
                                </div>
                                
                                <p style="font-size: 14px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #f1f5f9; pt: 20px;">Best regards,<br><strong style="color: #1e293b;">Homedify Support Team</strong></p>
                            </div>
                            <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
                                <p>© ${new Date().getFullYear()} Homedify. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error('Email Error:', emailErr);
        }

        // 2. Create System Notification if user exists
        const user = await User.findOne({ email: inquiry.email.toLowerCase() });
        if (user) {
            await Notification.create({
                userId: user._id,
                message: `Admin replied to your inquiry: ${message.substring(0, 100)}...`,
                type: 'system',
                link: '/customer/support'
            });
        }

        // 3. Update Status
        inquiry.status = 'replied';
        await inquiry.save();

        res.status(200).json({
            success: true,
            message: 'Reply sent successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
