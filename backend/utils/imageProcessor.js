import sharp from "sharp";
import fs from "fs";
import path from "path";
import logger from "./logger.js";

export const IMAGE_MAX_WIDTH = 600;

export const optimizeUploadedImage = async (filePath, { maxWidth = IMAGE_MAX_WIDTH } = {}) => {
  try {
    const dir = path.dirname(filePath);
    const newName = `${path.basename(filePath, path.extname(filePath))}.webp`;
    const newPath = path.join(dir, newName);

    await sharp(filePath)
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(newPath);

    fs.unlinkSync(filePath);
    return newName;
  } catch (error) {
    logger.warn(`Image optimization failed, keeping original: ${error.message}`);
    return path.basename(filePath);
  }
};
