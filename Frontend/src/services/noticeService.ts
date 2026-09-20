import { announcementService } from './announcementService';

export * from './announcementService';

export const noticeService = {
  ...announcementService,
  getNoticeById: async (id: string) => {
    const res = await announcementService.getAnnouncementById(id);
    return res.announcement as any;
  },
  getNotices: async () => {
    const res = await announcementService.getAnnouncements();
    return res.announcements as any[];
  },
  getAllNotices: async () => {
    const res = await announcementService.getAnnouncements();
    return res.announcements as any[];
  },
  createNotice: async (payload: any, _userId?: string) => {
    return announcementService.createAnnouncement(payload);
  },
  markAsRead: (id: string, _userId?: string) => announcementService.markAsRead(id)
};
