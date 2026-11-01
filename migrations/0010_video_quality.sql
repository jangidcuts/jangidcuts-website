-- Nov 1: video quality renditions (720p/480p/360p...) for uploaded product + portfolio videos
ALTER TABLE products ADD COLUMN video_q TEXT DEFAULT '';
ALTER TABLE portfolio ADD COLUMN video_q TEXT DEFAULT '';
