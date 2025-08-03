import { useEffect, useState, type ReactNode } from 'react';
import CompanyHeader from '../../Component/CompanyHeader';
import { GetApplicationsByPostId, UpdateApplicationStatus } from '../../../services/https/Application/index';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';



interface ApplicationInterface {
    post_name: ReactNode;
    id?: number;
    name: string;
    position: string;
    status: 'รอการนัดสัมภาษณ์' | 'กำลังพิจารณา' | 'ไม่ได้รับเลือก' | 'ผ่านการคัดเลือก';
    companyNote?: string;
    resume?: string;
    transcript?: string;
    submit_at?: string;
    internship_post_id?: number;
}

const Dashboard = () => {
    const { postId } = useParams();
    const [applications, setApplications] = useState<ApplicationInterface[]>([]);
    const [approvalStats, setApprovalStats] = useState({ approved: 0, pending: 0, rejected: 0 });
    const [showModal, setShowModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<ApplicationInterface | null>(null);
    const [newStatus, setNewStatus] = useState<ApplicationInterface['status'] | null>(null);
    const [note, setNote] = useState('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchStatus, setSearchStatus] = useState<string>('');
    const [searchDate, setSearchDate] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        const handleNewApplication = (event: any) => {
            if (Number(event.detail.postId) === Number(postId)) {
                fetchApplications();
                console.log("🧾 Post ID from URL:", postId);

            }
        };
        window.addEventListener("application-submitted", handleNewApplication);
        return () => {
            window.removeEventListener("application-submitted", handleNewApplication);
        };
    }, [postId]);

    useEffect(() => {
        fetchApplications();
    }, [postId]);

    const handleScheduleInterview = (application: ApplicationInterface) => {
        navigate("/company/interview_appointments", {
          state: {
            studentId: application.id,
            studentName: application.name,
            postName: application.post_name,
            internshipPostId: application.internship_post_id,
          },
        });
      };


    const fetchApplications = async () => {
        if (!postId) return;
        const res = await GetApplicationsByPostId(Number(postId));
        console.log("📦 API Response:", res);
        const realApplications = res?.data?.data || [];

        // ตรวจสอบว่าข้อมูลที่ได้มีจริงหรือไม่
        if (!Array.isArray(realApplications)) {
            console.error("❌ ข้อมูลที่ได้จาก API ไม่ใช่ array:", realApplications);
            return;
        }

        const mappedApps: ApplicationInterface[] = realApplications.map((app: any) => ({
            id: app.id,
            name: app.student_name,
            post_name: app.post_name, // ✅ ใส่เข้าไปใน mappedApps
            position: app.post_name, // ✅ ต้องใส่ฟิลด์นี้ เพราะ type บังคับ
            status: app.status,
            companyNote: app.company_note,
            resume: app.resume,
            transcript: app.transcript,
            submit_at: app.date,
            internship_post_id: Number(postId),
        }));


        console.log("✅ mappedApps:", mappedApps);
        setApplications(mappedApps);
    };


    useEffect(() => {
  calculateStats(applications);             // ✅ ถูกต้อง
}, [applications]);


    const calculateStats = (data: ApplicationInterface[]) => {
        const stats = { approved: 0, pending: 0, rejected: 0 };
        data.forEach((application) => {
            if (application.status === 'รอการนัดสัมภาษณ์') stats.approved++;
            else if (application.status === 'กำลังพิจารณา') stats.pending++;
            else stats.rejected++;
        });
        setApprovalStats(stats); // ✅ << ตรงนี้แหละ
    };


    const handleApproval = (
        application: ApplicationInterface,
        status: 'รอการนัดสัมภาษณ์' | 'ไม่ได้รับเลือก'
    ) => {
        setSelectedApplication(application);
        setNewStatus(status);
        setShowModal(true);
    };

    const confirmApproval = async () => {
        if (selectedApplication && newStatus) {
            try {
                await UpdateApplicationStatus(selectedApplication.id!, newStatus, note); // เรียก API

                // อัปเดตใน frontend state
                const updatedApplications = applications.map(app =>
                    app.id === selectedApplication.id
                        ? { ...app, status: newStatus, companyNote: note }
                        : app
                );

                setApplications(updatedApplications);
                setSelectedApplication(null);
                setNewStatus(null);
                setShowModal(false);
                setNote('');
            } catch (error) {
                alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
            }
        }
    };



    const fileBaseURL = 'http://localhost:8000'; // ✅ ปรับตาม backend จริงของคุณ



    return (
        <div style={containerStyle}>
            <CompanyHeader />

            <div style={summaryCardStyle}>
                <h3 style={headingStyle}>📊 สรุปผลคำขอ</h3>
                <div style={summaryFieldsStyle}>
                    <div style={{...summaryItemStyle, ...summaryItemTotalStyle}}>
                        <div style={iconStyle}>📋</div>
                        <h4>คำขอทั้งหมด</h4>
                        <p style={statsNumberStyle}>{applications.length}</p>
                    </div>
                    <div style={{...summaryItemStyle, ...summaryItemApprovedStyle}}>
                        <div style={iconStyle}>✅</div>
                        <h4>อนุมัติ</h4>
                        <p style={statsNumberStyle}>{approvalStats.approved}</p>
                    </div>
                    <div style={{...summaryItemStyle, ...summaryItemPendingStyle}}>
                        <div style={iconStyle}>⏳</div>
                        <h4>รอการอนุมัติ</h4>
                        <p style={statsNumberStyle}>{approvalStats.pending}</p>
                    </div>
                    <div style={{...summaryItemStyle, ...summaryItemRejectedStyle}}>
                        <div style={iconStyle}>❌</div>
                        <h4>ไม่อนุมัติ</h4>
                        <p style={statsNumberStyle}>{approvalStats.rejected}</p>
                    </div>

                </div>
            </div>

            <div style={summaryCardStyle}>
                <h3 style={headingStyle}>📝 ใบสมัครที่รอการอนุมัติ</h3>
                <div style={searchBoxContainerStyle}>
                    <div style={searchInputWrapperStyle}>
                        <label style={searchLabelStyle}>🔍 ค้นหาชื่อผู้สมัครหรือตำแหน่ง</label>
                        <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            style={searchInputStyle} 
                            placeholder="พิมพ์ชื่อหรือตำแหน่ง..."
                        />
                    </div>
                    <div style={searchInputWrapperStyle}>
                        <label style={searchLabelStyle}>📅 ค้นหาวันที่</label>
                        <input 
                            type="date" 
                            value={searchDate} 
                            onChange={(e) => setSearchDate(e.target.value)} 
                            style={searchInputStyle} 
                        />
                    </div>
                </div>

                <div style={requestBoxStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={tableHeaderStyle}>
                                <th style={thStyle}>👤 ชื่อผู้สมัคร</th>
                                <th style={thStyle}>💼 ตำแหน่ง</th>
                                <th style={thStyle}>📅 วันที่ส่ง</th>
                                <th style={thStyle}>📄 Resume</th>
                                <th style={thStyle}>📊 Transcript</th>
                                <th style={thStyle}>🔄 สถานะ</th>
                                <th style={thStyle}>📝 หมายเหตุ</th>
                                <th style={thStyle}>⚙️ การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications
                                .filter(app => app.status === 'กำลังพิจารณา')
                                .filter(app =>
                                    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    app.position.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .filter(app => searchDate ? app.submit_at?.startsWith(searchDate) : true)
                                .map(application => (
                                    <tr key={application.id} style={tableRowStyle}>
                                        <td style={tdStyle}>{application.name}</td>
                                        <td style={tdStyle}>{application.post_name}</td>
                                        <td style={tdStyle}>{application.submit_at}</td>
                                        <td style={tdStyle}>
                                            {application.resume ? (
                                                <a href={`${fileBaseURL}${application.resume}`} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                                                    📎 ดูไฟล์
                                                </a>
                                            ) : <span style={noDataStyle}>-</span>}
                                        </td>
                                        <td style={tdStyle}>
                                            {application.transcript ? (
                                                <a href={`${fileBaseURL}${application.transcript}`} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                                                    📎 ดูไฟล์
                                                </a>
                                            ) : <span style={noDataStyle}>-</span>}
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={statusBadgeStyle}>{application.status}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={actionButtonsStyle}>
                                                <button 
                                                    style={approveButtonStyle} 
                                                    onClick={() => handleApproval(application, 'รอการนัดสัมภาษณ์')}
                                                    onMouseEnter={(e) => {
                                                        const target = e.target as HTMLButtonElement;
                                                        target.style.transform = 'translateY(-2px) scale(1.05)';
                                                      }}
                                                      onMouseLeave={(e) => {
                                                        const target = e.target as HTMLButtonElement;
                                                        target.style.transform = 'translateY(0) scale(1)';
                                                      }}
                                                      
                                                >
                                                    ✅ อนุมัติ
                                                </button>
                                                <button 
                                                    style={rejectButtonStyle} 
                                                    onClick={() => handleApproval(application, 'ไม่ได้รับเลือก')}
                                                    onMouseEnter={(e) => {
                                                        const target = e.target as HTMLButtonElement;
                                                        target.style.transform = 'translateY(-2px) scale(1.05)';
                                                      }}
                                                      onMouseLeave={(e) => {
                                                        const target = e.target as HTMLButtonElement;
                                                        target.style.transform = 'translateY(0) scale(1)';
                                                      }}
                                                      
                                                >
                                                    ❌ ไม่อนุมัติ
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>

                    </table>
                </div>
            </div>

            <div style={summaryCardStyle}>
                <h3 style={headingStyle}>📋 ประวัติใบสมัครทั้งหมด</h3>
                <div style={searchStatusContainerStyle}>
                    <label style={searchLabelStyle}>🔍 ค้นหาสถานะ</label>
                    <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)} style={dropdownStyle}>
                        <option value="">เลือกสถานะ</option>
                        <option value="รอการนัดสมัภาษณ์">รอการนัดสมัภาษณ์</option>
                        <option value="ไม่ได้รับเลือก">ไม่ได้รับเลือก</option>
                    </select>
                </div>

                <div style={requestBoxStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={tableHeaderStyle}>
                                <th style={thStyle}>👤 ชื่อผู้สมัคร</th>
                                <th style={thStyle}>💼 ตำแหน่ง</th>
                                <th style={thStyle}>📅 วันที่ส่ง</th>
                                <th style={thStyle}>🔄 สถานะ</th>
                                <th style={thStyle}>📝 หมายเหตุ</th>
                                <th style={thStyle}>⚙️ จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map(app => (
                                <tr key={app.id} style={tableRowStyle}>
                                    <td style={tdStyle}>{app.name}</td>
                                    <td style={tdStyle}>{app.post_name}</td>
                                    <td style={tdStyle}>{app.submit_at}</td>
                                    <td style={tdStyle}>
                                        <span style={getStatusStyle(app.status)}>{app.status}</span>
                                    </td>
                                    <td style={tdStyle}>{app.companyNote || <span style={noDataStyle}>-</span>}</td>
                                    <td style={tdStyle}>
                                        {app.status === 'รอการนัดสัมภาษณ์' && (
                                            <button
                                            onClick={() => handleScheduleInterview(app)}
                                            style={{
                                                ...interviewButtonStyle,
                                                backgroundColor: app.status === 'รอการนัดสัมภาษณ์' ? '#2196f3' : '#cccccc',
                                                cursor: app.status === 'รอการนัดสัมภาษณ์' ? 'pointer' : 'not-allowed',
                                                opacity: app.status === 'รอการนัดสัมภาษณ์' ? 1 : 0.5,
                                            }}
                                            disabled={app.status !== 'รอการนัดสัมภาษณ์'}
                                            onMouseEnter={(e) => {
                                                const target = e.target as HTMLButtonElement;
                                                if (app.status === 'รอการนัดสัมภาษณ์') {
                                                    target.style.transform = 'translateY(-2px) scale(1.05)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                const target = e.target as HTMLButtonElement;
                                                target.style.transform = 'translateY(0) scale(1)';
                                            }}
                                        >
                                            🗓️ นัดสัมภาษณ์
                                        </button>
                                        
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>


                    </table>
                </div>
            </div>

            {showModal && selectedApplication && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <div style={modalHeadingBoxStyle}>
                            <h3 style={modalHeadingStyle}>
                                {newStatus === 'รอการนัดสัมภาษณ์' ? '✅ คุณแน่ใจหรือไม่ที่จะอนุมัติคำขอนี้?' : '❌ คุณแน่ใจหรือไม่ที่จะไม่อนุมัติคำขอนี้?'}
                            </h3>
                        </div>
                        <div style={modalContentStyle}>
                            <p><strong>👤 ชื่อ:</strong> {selectedApplication.name}</p>
                            <p><strong>💼 ตำแหน่ง:</strong> {selectedApplication.position}</p>
                            <p><strong>📅 วันที่ส่ง:</strong> {selectedApplication.submit_at}</p>
                        </div>
                        <textarea
                            style={modalInputStyle}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="📝 หมายเหตุเพิ่มเติม (ไม่จำเป็น)"
                            rows={4}
                        />
                        <div style={modalActionsStyle}>
                            <button 
                                onClick={confirmApproval} 
                                style={modalConfirmButtonStyle}
                                onMouseEnter={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    target.style.transform = 'translateY(-2px) scale(1.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    target.style.transform = 'translateY(0) scale(1)';
                                  }}
                                  
                            >
                                ✅ ยืนยัน
                            </button>
                            <button 
                                onClick={() => setShowModal(false)} 
                                style={modalCancelButtonStyle}
                                onMouseEnter={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    target.style.transform = 'translateY(-2px) scale(1.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    target.style.transform = 'translateY(0) scale(1)';
                                  }}
                                  
                            >
                                ❌ ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function for status styling
const getStatusStyle = (status: string) => {
    const baseStyle = {
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-block',
        minWidth: '100px',
        textAlign: 'center' as const,
    };

    switch (status) {
        case 'รอการนัดสัมภาษณ์':
            return { ...baseStyle, backgroundColor: '#e3f2fd', color: '#1976d2', border: '1px solid #bbdefb' };
        case 'กำลังพิจารณา':
            return { ...baseStyle, backgroundColor: '#fff3e0', color: '#f57c00', border: '1px solid #ffcc02' };
        case 'ไม่ได้รับเลือก':
            return { ...baseStyle, backgroundColor: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2' };
        default:
            return { ...baseStyle, backgroundColor: '#f5f5f5', color: '#616161', border: '1px solid #e0e0e0' };
    }
};

// Light Blue Theme Styles
const containerStyle = {
    background: '#f0f8ff', // Very light blue background
    minHeight: '100vh',
    padding: '20px',
};

const headingStyle = {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: '20px',
    textAlign: 'left' as const,
};

const summaryCardStyle = {
    marginBottom: '25px',
    padding: '20px',
    borderRadius: '8px',
    background: '#ffffff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e3f2fd',
};

const summaryFieldsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
    flexWrap: 'wrap' as const,
};

const summaryItemStyle: React.CSSProperties = {
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    flex: 1,
    minWidth: '180px',
    backgroundColor: '#ffffff',
    border: '1px solid #e3f2fd',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
};

const summaryItemTotalStyle = {
    backgroundColor: '#e3f2fd',
    borderColor: '#90caf9',
};

const summaryItemApprovedStyle = {
    backgroundColor: '#e8f5e8',
    borderColor: '#a5d6a7',
};

const summaryItemPendingStyle = {
    backgroundColor: '#fff3e0',
    borderColor: '#ffcc02',
};

const summaryItemRejectedStyle = {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
};

const iconStyle = {
    fontSize: '20px',
    marginBottom: '8px',
};

const statsNumberStyle = {
    fontSize: '28px',
    fontWeight: '600',
    margin: '8px 0',
    color: '#1976d2',
};

const searchBoxContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
};

const searchInputWrapperStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: '250px',
};

const searchLabelStyle = {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#424242',
};

const searchInputStyle = {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    background: '#ffffff',
    transition: 'border-color 0.2s ease',
    ':focus': {
        borderColor: '#1976d2',
        outline: 'none',
    }
};

const dropdownStyle = {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    background: '#ffffff',
    cursor: 'pointer',
};

const searchStatusContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: '15px',
    gap: '10px',
};

const requestBoxStyle = {
    background: '#ffffff',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #e3f2fd',
    overflow: 'auto',
};

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
};

const tableHeaderStyle = {
    backgroundColor: '#e3f2fd',
};

const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '14px',
    color: '#1976d2',
    borderBottom: '2px solid #bbdefb',
};

const tableRowStyle: React.CSSProperties = {
    transition: 'background-color 0.2s ease',
    cursor: 'pointer',
  };
  

const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'center',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '14px',
    color: '#424242',
};

const linkStyle = {
    color: '#1976d2',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease',
    ':hover': {
        backgroundColor: '#e3f2fd',
    }
};

const noDataStyle = {
    color: '#9e9e9e',
    fontStyle: 'italic',
};

const statusBadgeStyle = {
    padding: '6px 12px',
    backgroundColor: '#fff3e0',
    color: '#f57c00',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid #ffcc02',
};

const actionButtonsStyle = {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
};

const approveButtonStyle = {
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
        backgroundColor: '#45a049',
    }
};

const rejectButtonStyle = {
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
        backgroundColor: '#da190b',
    }
};

const interviewButtonStyle = {
    background: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
        backgroundColor: '#1976d2',
    }
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
    background: '#ffffff',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    width: '400px',
    maxWidth: '90vw',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #e3f2fd',
};

const modalHeadingBoxStyle: React.CSSProperties = {
    background: '#e3f2fd',
    color: '#1976d2',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '15px',
};

const modalHeadingStyle = {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0',
};

const modalContentStyle = {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #e9ecef',
};

const modalActionsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: '15px',
    gap: '10px',
};

const modalConfirmButtonStyle = {
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    flex: 1,
    transition: 'background-color 0.2s ease',
    ':hover': {
        backgroundColor: '#45a049',
    }
};

const modalCancelButtonStyle = {
    background: '#9e9e9e',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    flex: 1,
    transition: 'background-color 0.2s ease',
    ':hover': {
        backgroundColor: '#757575',
    }
};

const modalInputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    background: '#ffffff',
    transition: 'border-color 0.2s ease',
    ':focus': {
        borderColor: '#1976d2',
        outline: 'none',
    }
};

export default Dashboard;