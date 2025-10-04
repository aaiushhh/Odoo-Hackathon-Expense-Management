import React, { useState } from "react";
import { userApi } from '../../services/api';
import './AdminDashboard.css';

const ApprovalRuleDialog = ({ user, managers, onClose }) => {
  const approvers = managers.filter((m) => m._id !== user._id);
  const cfos = approvers.filter((m) => m.role === "CFO");
  const directors = approvers.filter((m) => m.role === "Director");

  const [rules, setRules] = useState({
    percentageThreshold: 60,
    cfoOverride: true,
    managerAsFirstStep: true,
    sequenceEnabled: false,
    requiredApproverIds: [],
  });

  const handleCheckboxChange = (name, value) => {
    setRules((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequiredApproverToggle = (approverId) => {
    setRules((prev) => {
      const current = prev.requiredApproverIds;
      if (current.includes(approverId)) {
        return {
          ...prev,
          requiredApproverIds: current.filter((id) => id !== approverId),
        };
      } else {
        return { ...prev, requiredApproverIds: [...current, approverId] };
      }
    });
  };

  const handleSaveRules = async () => {
    try {
      await userApi.updateApprovalRules(user._id, rules);
      alert('Approval rules updated successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to save rules:', error);
      alert('Failed to save rules. Check console for details.');
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">
            Approval Rules for: {user.name} ({user.role})
          </h3>
        </div>

        {/* General Approval Conditions */}
        <div className="admin-modal-section">
          <h4 className="admin-section-title">General Thresholds</h4>
          <div className="admin-threshold-container">
            <label className="admin-threshold-label">
              Percentage Threshold: If more than
              <input
                type="number"
                min="0"
                max="100"
                value={rules.percentageThreshold}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    percentageThreshold: parseInt(e.target.value),
                  })
                }
                className="admin-number-input"
              />
              % of assigned approvers approve, the flow proceeds.
            </label>
          </div>
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={rules.managerAsFirstStep}
              onChange={(e) =>
                handleCheckboxChange("managerAsFirstStep", e.target.checked)
              }
              className="admin-checkbox"
            />
            <span className="admin-checkbox-text">
              <strong>Manager Approval First:</strong> The user's direct manager
              must approve before requests go to others.
            </span>
          </label>
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={rules.sequenceEnabled}
              onChange={(e) =>
                handleCheckboxChange("sequenceEnabled", e.target.checked)
              }
              className="admin-checkbox"
            />
            <span className="admin-checkbox-text">
              <strong>Strict Sequence:</strong> Requests are sent in a specific
              order (Manager, then Required Approvers). If unchecked, requests
              are sent in parallel.
            </span>
          </label>
        </div>

        {/* Required Approvers */}
        <div className="admin-modal-section">
          <h4 className="admin-section-title">
            Mandatory Approvers (Must Approve)
          </h4>
          <p className="admin-section-description">
            Select individuals whose explicit approval is always required.
          </p>
          <div className="admin-approver-grid">
            {[
              ...cfos,
              ...directors,
              ...approvers.filter((m) => m.role === "Manager"),
            ].map((m) => (
              <label key={m._id} className="admin-approver-label">
                <input
                  type="checkbox"
                  checked={rules.requiredApproverIds.includes(m._id)}
                  onChange={() => handleRequiredApproverToggle(m._id)}
                  className="admin-checkbox"
                />
                <span className="admin-approver-text">
                  {m.name} ({m.role})
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="admin-modal-footer">
          <button onClick={onClose} className="admin-cancel-button">
            Cancel
          </button>
          <button onClick={handleSaveRules} className="admin-save-button">
            Save Rules
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalRuleDialog;