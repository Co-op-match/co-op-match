import React, { useEffect, useState } from 'react';
import { Form, Select, Row, Col, message } from 'antd';
import type { FormInstance } from 'antd';
import { GetAllSkill, GetAllInterest } from '../../../../services/https';
import type { SkillInterface } from '../../../../interfaces/Skill';
import type { InterestInterface } from '../../../../interfaces/Interest';

export interface StepSkillsProps {
  form: FormInstance<any>;
  formData?: any;
}

const StepSkills: React.FC<StepSkillsProps> = () => {
  const [skills, setSkills] = useState<SkillInterface[]>([]);
  const [interests, setInterests] = useState<InterestInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const skillsData = await GetAllSkill();
        const interestsData = await GetAllInterest();
        setSkills(skillsData);
        setInterests(interestsData);
        console.log(skillsData)
        console.log("i",interestsData)
      } catch {
        messageApi.error({
          content: 'โหลดข้อมูลทักษะหรือความสนใจไม่สำเร็จ',
          style: { marginTop: '20vh' },
          duration: 3,
        });
      }
    };

    fetchOptions();
  }, []);

  return (
    <>
      {contextHolder}
      <div className="form-section-title">ทักษะและความสนใจ</div>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label="ทักษะ"
            name="skills"
            validateTrigger="onSubmit"
            rules={[{ required: true, message: 'กรุณาเลือกทักษะอย่างน้อย 1 รายการ' }]}
          >
            <Select mode="multiple" placeholder="เลือกทักษะ" allowClear>
              {skills.map(skill => (
                <Select.Option key={skill.ID} value={skill.ID}>
                  {skill.skill_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            label="ความสนใจ"
            name="interests"
            validateTrigger="onSubmit"
            rules={[{ required: true, message: 'กรุณาเลือกความสนใจอย่างน้อย 1 รายการ' }]}
          >
            <Select mode="multiple" placeholder="เลือกความสนใจ" allowClear>
              {interests.map(interest => (
                <Select.Option key={interest.ID} value={interest.ID}>
                  {interest.interest_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StepSkills;
