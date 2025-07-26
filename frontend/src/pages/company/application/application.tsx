import { useEffect, useState, type ReactNode } from 'react';
import CoopMatchHeader from '../../Component/CoopMatchHeader';
import { GetApplicationsByPostId, UpdateApplicationStatus } from '../../../services/https/Application/index';
import { useParams } from 'react-router-dom';

interface ApplicationInterface {
    post_name: ReactNode;
    id?: number;
    name: string;
    position: string;
    status: 'รอการนัดสมัภาษณ์' | 'กำลังพิจารณา' | 'ไม่ได้รับเลือก' | 'ผ่านการคัดเลือก';
    companyNote?: string;
    resume?: string;
    transcript?: string;
    submit_at?: string;
    internship_post_id?: number;
}

const Dashboard = () => {
    const { postId } = useParams();
    const [applications, setApplications] = useState<ApplicationInterface[]>([]);
    const [approvedApplications, setApprovedApplications] = useState<ApplicationInterface[]>([]);
    const [rejectedApplications, setRejectedApplications] = useState<ApplicationInterface[]>([]);
    const [approvalStats, setApprovalStats] = useState({ approved: 0, pending: 0, rejected: 0 });
    const [showModal, setShowModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<ApplicationInterface | null>(null);
    const [newStatus, setNewStatus] = useState<ApplicationInterface['status'] | null>(null);
    const [note, setNote] = useState('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchStatus, setSearchStatus] = useState<string>('');
    const [searchDate, setSearchDate] = useState<string>('');



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
        // ตัวอย่าง: ใช้ alert หรือเปิด modal นัดสัมภาษณ์จริงก็ได้
        alert(`คุณกำลังนัดสัมภาษณ์กับ ${application.name}`);
        // TODO: สามารถเปลี่ยนเป็นการเปิด modal หรือไปหน้า schedule ได้
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
        filterApplicationsByStatus(applications); // << ถ้าต้องการใช้ต่อ
        calculateStats(applications);             // ✅ ถูกต้อง
      }, [applications]);
      

    const calculateStats = (data: ApplicationInterface[]) => {
        const stats = { approved: 0, pending: 0, rejected: 0 };
        data.forEach((application) => {
            if (application.status === 'รอการนัดสมัภาษณ์') stats.approved++;
            else if (application.status === 'กำลังพิจารณา') stats.pending++;
            else stats.rejected++;
        });
        setApprovalStats(stats); // ✅ << ตรงนี้แหละ
    };


    const filterApplicationsByStatus = (data: ApplicationInterface[]) => {
        const approved = data.filter(application => application.status === 'รอการนัดสมัภาษณ์');
        const rejected = data.filter(application => application.status === 'ไม่ได้รับเลือก');
        setApprovedApplications(approved);
        setRejectedApplications(rejected);
    };



    const handleApproval = (
        application: ApplicationInterface,
        status: 'รอการนัดสมัภาษณ์' | 'ไม่ได้รับเลือก'
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
            <CoopMatchHeader />

            <div style={summaryCardStyle}>
                <h3 style={headingStyle}>สรุปผลคำขอ</h3>
                <div style={summaryFieldsStyle}>
                    <div style={summaryItemStyle}>
                        <h4>คำขอทั้งหมด</h4>
                        <p>{applications.length}</p>
                    </div>
                    <div style={summaryItemStyle}>
                        <h4>อนุมัติ</h4>
                        <p>{approvalStats.approved}</p>
                    </div>
                    <div style={summaryItemStyle}>
                        <h4>รอการอนุมัติ</h4>
                        <p>{approvalStats.pending}</p>
                    </div>
                    <div style={summaryItemStyle}>
                        <h4>ไม่อนุมัติ</h4>
                        <p>{approvalStats.rejected}</p>
                    </div>

                </div>
            </div>

            <div style={summaryCardStyle}>
                <h3 style={headingStyle}>คำขอร้องการอนุมัติ</h3>
                <div style={searchBoxContainerStyle}>
                    <div style={searchInputWrapperStyle}>
                        <label style={searchLabelStyle}>ค้นหาชื่อผู้สมัครหรือตำแหน่ง</label>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={smallSearchInputStyle} />
                    </div>
                    <div style={searchInputWrapperStyle}>
                        <label style={searchLabelStyle}>ค้นหาวันที่</label>
                        <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} style={smallSearchInputStyle} />
                    </div>
                </div>

                <div style={requestBoxStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th>ชื่อผู้สมัคร</th>
                                <th>ตำแหน่ง</th>
                                <th>วันที่ส่ง</th>
                                <th>Resume</th>
                                <th>Transcript</th>
                                <th>สถานะ</th>
                                <th>หมายเหตุ</th>
                                <th>การจัดการ</th>
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
                                    <tr key={application.id}>
                                        <td>{application.name}</td>
                                        <td>{application.post_name}</td>
                                        <td>{application.submit_at}</td>
                                        <td>
                                            {application.resume ? (
                                                <a href={`${fileBaseURL}${application.resume}`} target="_blank" rel="noopener noreferrer">ดู</a>
                                            ) : "-"}
                                        </td>
                                        <td>
                                            {application.transcript ? (
                                                <a href={`${fileBaseURL}${application.transcript}`} target="_blank" rel="noopener noreferrer">ดู</a>
                                            ) : "-"}
                                        </td>
                                        <td>{application.status}</td>
                                        <td>
                                            <button style={buttonStyle} onClick={() => handleApproval(application, 'รอการนัดสมัภาษณ์')}>
                                                อนุมัติ
                                            </button>
                                            <button style={buttonStyle} onClick={() => handleApproval(application, 'ไม่ได้รับเลือก')}>
                                                ไม่อนุมัติ
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>

                    </table>
                </div>
            </div>

            <div style={summaryCardStyle}>
                <h3 style={headingStyle}>ประวัติคำขอทั้งหมด</h3>
                <div style={searchStatusContainerStyle}>
                    <label style={searchLabelStyle}>ค้นหาสถานะ</label>
                    <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)} style={dropdownStyle}>
                        <option value="">เลือกสถานะ</option>
                        <option value="รอการนัดสมัภาษณ์">รอการนัดสมัภาษณ์</option>
                        <option value="ไม่ได้รับเลือก">ไม่ได้รับเลือก</option>
                    </select>
                </div>

                <div style={requestBoxStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th>ชื่อผู้สมัคร</th>
                                <th>ตำแหน่ง</th>
                                <th>วันที่ส่ง</th>
                                <th>สถานะ</th>
                                <th>หมายเหตุ</th>
                                <th>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map(app => (
                                <tr key={app.id} style={tableRowStyle}>
                                    <td style={thTdStyle}>{app.name}</td>
                                    <td style={thTdStyle}>{app.post_name}</td>
                                    <td style={thTdStyle}>{app.submit_at}</td>
                                    <td style={thTdStyle}>{app.status}</td>
                                    <td style={thTdStyle}>{app.companyNote || '-'}</td>
                                    <td style={thTdStyle}>
                                        {app.status === 'รอการนัดสมัภาษณ์' && (
                                            <button onClick={() => handleScheduleInterview(app)} style={buttonStyle}>
                                                นัดสัมภาษณ์
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
                                {newStatus === 'รอการนัดสมัภาษณ์' ? 'คุณแน่ใจหรือไม่ที่จะอนุมัติคำขอนี้?' : 'คุณแน่ใจหรือไม่ที่จะไม่อนุมัติคำขอนี้?'}
                            </h3>
                        </div>
                        <p>ชื่อ: {selectedApplication.name}</p>
                        <p>ตำแหน่ง: {selectedApplication.position}</p>
                        <p>วันที่ส่ง: {selectedApplication.submit_at}</p>
                        <textarea
                            style={modalInputStyle}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="หมายเหตุเพิ่มเติม (ไม่จำเป็น)"
                            rows={4}
                        />
                        <div style={modalActionsStyle}>
                            <button onClick={confirmApproval} style={modalButtonStyle}>ยืนยัน</button>
                            <button onClick={() => setShowModal(false)} style={modalButtonStyle}>ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const containerStyle = {
    backgroundColor: '#e6f7ff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const headingStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: '40px',
};

const buttonStyle = {
    backgroundColor: '#0066cc',
    color: 'white',
    borderRadius: '6px',
    padding: '5px 10px',
    fontWeight: 'bold',
    margin: '5px',
    cursor: 'pointer',
    // width: '5px',

};

const summaryCardStyle = {
    marginBottom: '30px',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#AFD5F4',
};

const summaryFieldsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
};

const summaryItemStyle: React.CSSProperties = {
    backgroundColor: '#D5E9FF',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center', // ✅ ใช้ CSSProperties เพื่อให้ถูกต้อง
    flex: 1,
};


const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'center',
    marginLeft: '0',

};

const thTdStyle: React.CSSProperties = {
    padding: '12px 20px', // ✅ เพิ่มช่องไฟซ้าย-ขวาเยอะขึ้น
    // verticalAlign: 'top',
    textAlign: 'center',
};



const tableRowStyle: React.CSSProperties = {
    borderBottom: '1px solid #ddd',
    padding: '12px',
    textAlign: 'center',
};


const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed' as const,
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};


const modalStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '400px',
    display: 'flex',
    flexDirection: 'column' as const,
};


const modalHeadingBoxStyle: React.CSSProperties = {
    backgroundColor: '#ADD8E6',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    marginBottom: '15px',
};


const modalHeadingStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
};

const modalActionsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: '15px',
};

const modalButtonStyle = {
    padding: '12px 25px',
    fontSize: '16px',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '48%',
};

const modalInputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    marginTop: '10px',
    fontSize: '16px',
};

const requestBoxStyle = {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px',
};
// สไตล์สำหรับช่องค้นหาที่เล็กลง
const smallSearchInputStyle = {
    width: '220px',  // ขนาดเล็กลง
    padding: '6px 10px',  // ลดขนาด padding
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '12px',  // ขนาดตัวอักษรเล็กลง
    backgroundColor: '#f0f8ff',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // เพิ่มเงานิดหน่อยให้ดูดี
    transition: 'all 0.3s ease-in-out', // เพิ่มเอฟเฟ็กต์เมื่อ hover
};

// สไตล์สำหรับกล่องค้นหา
const searchBoxContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px', // ช่องว่างระหว่างช่องค้นหา
    marginBottom: '20px',
};


// สไตล์สำหรับแต่ละกล่องค้นหา
const searchInputWrapperStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    marginRight: '10px',
};


// สไตล์สำหรับ label
const searchLabelStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#555',
};

// สไตล์สำหรับช่องค้นหา
// const searchInputStyle = {
//     width: '100%',
//     padding: '8px 12px', // ขนาดเล็กลง
//     borderRadius: '12px', // ทำให้มุมกลม
//     border: '1px solid #ccc',
//     fontSize: '14px', // ลดขนาดตัวอักษร
//     backgroundColor: '#f0f8ff', // พื้นหลังสีฟ้าอ่อน
//     boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // เพิ่มเงาให้ดูน่ารัก
//     transition: 'all 0.3s ease-in-out', // เพิ่มการเปลี่ยนแปลงเมื่อ hover
// };

// สไตล์สำหรับ dropdown (ค้นหาสถานะ)
const dropdownStyle = {
    width: '250px', // ลดขนาด dropdown
    padding: '8px 12px',
    borderRadius: '12px',
    border: '1px solid #ccc',
    fontSize: '14px',
    backgroundColor: '#f0f8ff',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
};

const searchStatusContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '10px', // เพิ่มช่องว่างระหว่าง label กับ dropdown
};


export default Dashboard;
