package analysis 
/* package analysis

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"github.com/gin-gonic/gin"
)

// GET /analysis/export?format=csv|pdf&type=kpis|trend|reviews|company|university&...พารามิเตอร์เดียวกับ endpoint นั้นๆ
func ExportReport(c *gin.Context) {
	format := c.DefaultQuery("format", "csv")
	reportType := c.DefaultQuery("type", "kpis")

	// ดึงข้อมูลจริงด้วยการ call handler ภายใน (หรือจะ duplicate logic ก็ได้)
	data, err := buildReportData(c, reportType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	base := fmt.Sprintf("%s_%s", reportType, now.Format("20060102_150405"))
	dir := "exports"
	_ = os.MkdirAll(dir, 0755)

	switch format {
	case "pdf":
		path := filepath.Join(dir, base+".pdf")
		if err := generatePDF(path, reportType, data); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "pdf failed: " + err.Error()})
			return
		}
		saveExportLog(reportType, "pdf", c.Request.URL.RawQuery, path)
		c.FileAttachment(path, filepath.Base(path))
	default:
		path := filepath.Join(dir, base+".csv")
		if err := generateCSV(path, reportType, data); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "csv failed: " + err.Error()})
			return
		}
		saveExportLog(reportType, "csv", c.Request.URL.RawQuery, path)
		c.FileAttachment(path, filepath.Base(path))
	}
}

func buildReportData(c *gin.Context, reportType string) (map[string]any, error) {
	// ใช้ context query ตรง ๆ แล้วเรียกฟังก์ชันคำนวณซ้ำแบบย่อ
	// เพื่อความกระชับ จะ re-run Logic บางส่วน
	rec := gin.H{}
	switch reportType {
	case "kpis":
		// reuse GetKPIs
		w := &responseCatcher{}
		ctx := c.Copy()
		ctx.Writer = w
		GetKPIs(ctx)
		return w.JSONBody, nil
	case "trend":
		w := &responseCatcher{}
		ctx := c.Copy()
		ctx.Writer = w
		GetApplicationTrend(ctx)
		return w.JSONBody, nil
	case "reviews":
		w := &responseCatcher{}
		ctx := c.Copy()
		ctx.Writer = w
		GetReviewSummary(ctx)
		return w.JSONBody, nil
	case "company":
		w := &responseCatcher{}
		ctx := c.Copy()
		ctx.Writer = w
		GetCompanyReport(ctx)
		return w.JSONBody, nil
	case "university":
		w := &responseCatcher{}
		ctx := c.Copy()
		ctx.Writer = w
		GetUniversityReport(ctx)
		return w.JSONBody, nil
	default:
		return nil, fmt.Errorf("unsupported report type")
	}
}

// --- CSV/PDF generators (ตัวอย่างเรียบง่าย) ---

func generateCSV(path, reportType string, data map[string]any) error {
	f, err := os.Create(path)
	if err != nil { return err }
	defer f.Close()
	w := csv.NewWriter(f)
	defer w.Flush()

	// เขียนหัวข้อ
	_ = w.Write([]string{"Report Type", reportType, "Generated At", time.Now().Format(time.RFC3339)})

	// แปลงข้อมูลหลักเป็น JSON แถวเดียว (สะดวกและสากล)
	js, _ := json.MarshalIndent(data, "", "  ")
	_ = w.Write([]string{"Data", string(js)})
	return nil
}

func generatePDF(path, reportType string, data map[string]any) error {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(40, 10, "Analysis Report")
	pdf.Ln(8)
	pdf.SetFont("Arial", "", 12)
	pdf.Cell(40, 8, fmt.Sprintf("Type: %s", reportType))
	pdf.Ln(6)
	pdf.Cell(40, 8, "Generated: "+time.Now().Format("2006-01-02 15:04:05"))
	pdf.Ln(10)

	js, _ := json.MarshalIndent(data, "", "  ")
	pdf.MultiCell(0, 6, string(js), "", "", false)

	return pdf.OutputFileAndClose(path)
}

func saveExportLog(reportType, format, params, path string) {
	db := config.DB()
	_ = db.Create(&entity.AnalysisExport{
		FileName:    filepath.Base(path),
		FilePath:    path,
		Format:      format,
		ReportType:  reportType,
		Params:      params,
		GeneratedAt: time.Now(),
	}).Error
}

// ---- helper to catch JSON ----
type responseCatcher struct {
	gin.ResponseWriter
	JSONBody map[string]any
	Status   int
}

func (w *responseCatcher) WriteHeaderNow() {}
func (w *responseCatcher) Write(data []byte) (int, error) { return len(data), nil }
func (w *responseCatcher) WriteHeader(code int)            { w.Status = code }
func (w *responseCatcher) Header() http.Header             { return http.Header{} }
func (w *responseCatcher) WriteString(s string) (int, error) { return len(s), nil }
func (w *responseCatcher) StatusCode() int                 { return w.Status }
func (w *responseCatcher) Size() int                       { return 0 }
func (w *responseCatcher) Written() bool                   { return true }
func (w *responseCatcher) WriteJSON(code int, obj any) {
	w.Status = code
	b, _ := json.Marshal(obj)
	_ = json.Unmarshal(b, &w.JSONBody)
}
func (w *responseCatcher) WriteHeaderNowJSON(code int, obj any) { w.WriteJSON(code, obj) } */
