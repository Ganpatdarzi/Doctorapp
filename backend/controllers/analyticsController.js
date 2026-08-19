import { buildAnalytics } from "../services/analyticsService.js";
import { buildCsv, buildWorkbook, streamPdf } from "../services/analyticsExporter.js";
import { sendSuccess } from "../utils/apiResponse.js";

const isValidPeriod = (p) =>
  ["7d", "30d", "3m", "6m", "12m", "all"].includes(p);

export const getAnalytics = async (req, res, next) => {
  try {
    const period = isValidPeriod(req.query.period) ? req.query.period : "30d";
    const data = await buildAnalytics({ period });
    return sendSuccess(res, 200, "Analytics retrieved successfully", data);
  } catch (error) {
    next(error);
  }
};

export const exportAnalytics = async (req, res, next) => {
  try {
    const { format = "pdf" } = req.query;
    const period = isValidPeriod(req.query.period) ? req.query.period : "30d";
    const data = await buildAnalytics({ period });
    const date = new Date(data.generatedAt).toISOString().slice(0, 10);
    const filename = `analytics-report-${date}`;

    if (format === "csv") {
      const csv = buildCsv(data);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}.csv`);
      return res.send(`\uFEFF${csv}`);
    }

    if (format === "xlsx") {
      const wb = buildWorkbook(data);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);
      await wb.xlsx.write(res);
      return res.end();
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}.pdf`);
    return streamPdf(res, data);
  } catch (error) {
    next(error);
  }
};
