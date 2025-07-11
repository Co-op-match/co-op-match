import { useEffect, useState } from 'react';
// import { GetApplications, UpdateApplication } from '../../../services/https/Application/index';
// เปลี่ยนเป็น
import CompanyHeader from '../../Component/CompanyHeader';


interface ApplicationInterface {
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
    const [applications, setApplications] = useState<ApplicationInterface[]>([
        { id: 1, name: 'มลฤดี มั่นคง', position: 'นักพัฒนาซอฟต์แวร์', status: 'กำลังพิจารณา', submit_at: '2025-06-17' },
        { id: 2, name: 'นภัสสร สุขใจ', position: 'นักออกแบบ UI/UX', status: 'กำลังพิจารณา', submit_at: '2025-06-16' },
        { id: 3, name: 'วิภาดา พงศ์วัฒน์', position: 'นักวิเคราะห์ข้อมูล', status: 'รอการนัดสมัภาษณ์', submit_at: '2025-06-15' },
        { id: 4, name: 'สุภัทรา พิชัย', position: 'นักพัฒนาระบบ', status: 'ไม่ได้รับเลือก', submit_at: '2025-06-14' },
    ]);
    const [approvedApplications, setApprovedApplications] = useState<ApplicationInterface[]>([]);
    const [rejectedApplications, setRejectedApplications] = useState<ApplicationInterface[]>([]);
    const [approvalStats, setApprovalStats] = useState({ approved: 0, pending: 0, rejected: 0 });
    const [showModal, setShowModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<ApplicationInterface | null>(null);
    const [newStatus, setNewStatus] = useState<ApplicationInterface['status'] | null>(null);
    const [note, setNote] = useState('');
    const [searchTerm, setSearchTerm] = useState<string>(''); // ค้นหาชื่อผู้สมัครหรือตำแหน่ง
    const [searchStatus, setSearchStatus] = useState<string>(''); // ค้นหาสถานะ
    const [searchDate, setSearchDate] = useState<string>(''); // ค้นหาวันที่

    useEffect(() => {
        filterApplicationsByStatus(applications);
        calculateStats(applications);
    }, [applications]);

    const calculateStats = (data: ApplicationInterface[]) => {
        const stats = { approved: 0, pending: 0, rejected: 0 };
        data.forEach((application) => {
            if (application.status === 'รอการนัดสมัภาษณ์') stats.approved++;
            else if (application.status === 'กำลังพิจารณา') stats.pending++;
            else stats.rejected++;
        });
        setApprovalStats(stats);
    };

    const filterApplicationsByStatus = (data: ApplicationInterface[]) => {
        const approved = data.filter(application => application.status === 'รอการนัดสมัภาษณ์');
        const rejected = data.filter(application => application.status === 'ไม่ได้รับเลือก');
        setApprovedApplications(approved);
        setRejectedApplications(rejected);
    };

    // ฟังก์ชันกรองข้อมูลตามคำค้นหาทั้งหมด
    const filteredApplications = applications.filter(application => {
        const matchesSearchTerm = application.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            application.position.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSearchDate = searchDate ? application.submit_at === searchDate : true;
        const matchesSearchStatus = searchStatus ? application.status === searchStatus : true;

        return matchesSearchTerm && matchesSearchDate && matchesSearchStatus;
    });

    const handleApproval = (
        application: ApplicationInterface,
        status: 'ผ่านการคัดเลือก' | 'ไม่ได้รับเลือก'
      ) => {
        setSelectedApplication(application);
        setNewStatus(status);
        setShowModal(true);
      };
      

    const confirmApproval = () => {
        if (selectedApplication && newStatus) {
          const updatedApplications = applications.map(application =>
            application.id === selectedApplication.id
              ? {
                  ...application,
                  status: newStatus,
                  companyNote: note,
                }
              : application
          );
          setApplications(updatedApplications);
          setShowModal(false);
          setNote('');
        }
      };
      

    return (
        
        <div style={containerStyle}>
            <CompanyHeader  />
            {/* สรุปผลทั้งหมด */}
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

            {/* คำขอร้องการอนุมัติ */}
            <div style={summaryCardStyle}>
                <h3 style={headingStyle}>คำขอร้องการอนุมัติ</h3>
                {/* ช่องค้นหาทั้งหมด */}
                <div style={searchBoxContainerStyle}>
                    <div style={searchInputWrapperStyle}>
                        <label style={searchLabelStyle}>ค้นหาชื่อผู้สมัครหรือตำแหน่ง</label>
                        <input
                            type="text"
                            placeholder="กรอกคำค้นหา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={smallSearchInputStyle} // เปลี่ยนเป็นสไตล์ที่เล็กลง
                        />
                    </div>
                    <div style={searchInputWrapperStyle}>
                        <label style={searchLabelStyle}>ค้นหาวันที่</label>
                        <input
                            type="date"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            style={smallSearchInputStyle} // เปลี่ยนเป็นสไตล์ที่เล็กลง
                        />
                    </div>
                </div>


                <div style={requestBoxStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th>ชื่อผู้สมัคร</th>
                                <th>ตำแหน่ง</th>
                                <th>วันที่ส่ง</th>
                                <th>สถานะ</th>
                                <th>การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* แสดงเฉพาะคำขอที่สถานะเป็น "กำลังพิจารณา" */}
                            {filteredApplications.filter(application => application.status === 'กำลังพิจารณา').map((application) => (
                                <tr key={application.id} style={tableRowStyle}>
                                    <td>{application.name}</td>
                                    <td>{application.position}</td>
                                    <td>{application.submit_at}</td>
                                    <td>{application.status}</td>
                                    <td>
                                        <button
                                            style={buttonStyle}
                                            onClick={() => handleApproval(application, 'ผ่านการคัดเลือก')}
                                        >
                                            อนุมัติ
                                        </button>
                                        <button
                                            style={buttonStyle}
                                            onClick={() => handleApproval(application, 'ไม่ได้รับเลือก')}
                                        >
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

                {/* ช่องค้นหาสถานะในมุมขวา */}
                <div style={searchStatusContainerStyle}>
                    <label style={searchLabelStyle}>ค้นหาสถานะ</label>
                    <select
                        value={searchStatus}
                        onChange={(e) => setSearchStatus(e.target.value)}
                        style={dropdownStyle}
                    >
                        <option value="">เลือกสถานะ</option>
                        <option value="รอการนัดสมัภาษณ์">ผ่านการคัดเลือก</option>
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
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApplications.map((application) => (
                                <tr key={application.id} style={tableRowStyle}>
                                    <td>{application.name}</td>
                                    <td>{application.position}</td>
                                    <td>{application.submit_at}</td>
                                    <td>{application.status}</td>
                                    <td>{application.companyNote || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Confirmation Modal */}
            {showModal && selectedApplication && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <div style={modalHeadingBoxStyle}>
                            <h3 style={modalHeadingStyle}>
                                {newStatus === 'ผ่านการคัดเลือก' ? 'คุณแน่ใจหรือไม่ที่จะอนุมัติคำขอนี้?' : 'คุณแน่ใจหรือไม่ที่จะไม่อนุมัติคำขอนี้?'}
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

// ส่วนของสไตล์ต่างๆ ตามที่ได้มีการจัดรูปแบบไว้แล้ว


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
    padding: '10px 20px',
    fontWeight: 'bold',
    margin: '5px',
    cursor: 'pointer',
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
    textAlign: 'left',
    marginLeft: '0',
  };
  

const tableRowStyle = {
    borderBottom: '1px solid #ddd',
    padding: '8px',
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
const searchInputStyle = {
    width: '100%',
    padding: '8px 12px', // ขนาดเล็กลง
    borderRadius: '12px', // ทำให้มุมกลม
    border: '1px solid #ccc',
    fontSize: '14px', // ลดขนาดตัวอักษร
    backgroundColor: '#f0f8ff', // พื้นหลังสีฟ้าอ่อน
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // เพิ่มเงาให้ดูน่ารัก
    transition: 'all 0.3s ease-in-out', // เพิ่มการเปลี่ยนแปลงเมื่อ hover
};

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
