import React, { useState, useEffect } from 'react';
import { userApi } from '../services/api';

const ApprovalRuleDialog = ({ user, managers, onClose }) => {
    const approvers = managers.filter(m => m._id !== user._id);
    const cfos = approvers.filter(m => m.role === 'CFO');
    const directors = approvers.filter(m => m.role === 'Director');
    
    const [rules, setRules] = useState({
        percentageThreshold: 60,
        cfoOverride: true,
        managerAsFirstStep: true,
        sequenceEnabled: false,
        requiredApproverIds: [],
    });

    const handleCheckboxChange = (name, value) => {
        setRules(prev => ({ ...prev, [name]: value }));
    };

    const handleRequiredApproverToggle = (approverId) => {
        setRules(prev => {
            const current = prev.requiredApproverIds;
            if (current.includes(approverId)) {
                return { ...prev, requiredApproverIds: current.filter(id => id !== approverId) };
            } else {
                return { ...prev, requiredApproverIds: [...current, approverId] };
            }
        });
    };

    const handleSaveRules = async () => {
        console.log(`Saving Approval Rules for user: ${user.name}`);
        console.log("Rules to save:", rules);
        
        // Example structure for the hypothetical save API call:
        // try {
        //     await userApi.updateApprovalRules(user._id, rules);
        //     alert('Approval rules updated successfully!');
        //     onClose();
        // } catch (error) {
        //     alert('Failed to save rules.');
        // }

        alert("Rules simulated to be saved! Check console for payload.");
        onClose();
    };

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <h3 style={styles.modalTitle}>
                        Approval Rules for: {user.name} ({user.role})
                    </h3>
                </div>

                {/* General Approval Conditions */}
                <div style={styles.section}>
                    <h4 style={styles.sectionTitle}>General Thresholds</h4>
                    <div style={styles.thresholdContainer}>
                        <label style={styles.thresholdLabel}>
                            Percentage Threshold: If more than
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={rules.percentageThreshold} 
                                onChange={(e) => setRules({...rules, percentageThreshold: parseInt(e.target.value)})}
                                style={styles.numberInput}
                            />
                            % of assigned approvers approve, the flow proceeds.
                        </label>
                    </div>
                    <label style={styles.checkboxLabel}>
                        <input 
                            type="checkbox" 
                            checked={rules.managerAsFirstStep} 
                            onChange={(e) => handleCheckboxChange('managerAsFirstStep', e.target.checked)}
                            style={styles.checkbox}
                        /> 
                        <span style={styles.checkboxText}>
                            <strong>Manager Approval First:</strong> The user's direct manager must approve before requests go to others.
                        </span>
                    </label>
                    <label style={styles.checkboxLabel}>
                        <input 
                            type="checkbox" 
                            checked={rules.sequenceEnabled} 
                            onChange={(e) => handleCheckboxChange('sequenceEnabled', e.target.checked)}
                            style={styles.checkbox}
                        /> 
                        <span style={styles.checkboxText}>
                            <strong>Strict Sequence:</strong> Requests are sent in a specific order (Manager, then Required Approvers). If unchecked, requests are sent in parallel.
                        </span>
                    </label>
                </div>

                {/* Required Approvers */}
                <div style={styles.section}>
                    <h4 style={styles.sectionTitle}>Mandatory Approvers (Must Approve)</h4>
                    <p style={styles.sectionDescription}>
                        Select individuals whose explicit approval is always required.
                    </p>
                    <div style={styles.approverGrid}>
                        {[...cfos, ...directors, ...approvers.filter(m => m.role === 'Manager')].map((m) => (
                            <label key={m._id} style={styles.approverLabel}>
                                <input 
                                    type="checkbox" 
                                    checked={rules.requiredApproverIds.includes(m._id)} 
                                    onChange={() => handleRequiredApproverToggle(m._id)}
                                    style={styles.checkbox}
                                />
                                <span style={styles.approverText}>{m.name} ({m.role})</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div style={styles.buttonContainer}>
                    <button onClick={onClose} style={styles.cancelButton}>Cancel</button>
                    <button onClick={handleSaveRules} style={styles.saveButton}>
                        Save Rules
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(30, 64, 175, 0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)'
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '650px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.3), 0 10px 10px -5px rgba(37, 99, 235, 0.2)',
        border: '2px solid #bfdbfe'
    },
    modalHeader: {
        backgroundColor: '#eff6ff',
        padding: '24px 30px',
        borderBottom: '2px solid #bfdbfe',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px'
    },
    modalTitle: {
        margin: 0,
        color: '#1e40af',
        fontSize: '22px',
        fontWeight: '600'
    },
    section: {
        padding: '24px 30px',
        borderBottom: '1px solid #e5e7eb'
    },
    sectionTitle: {
        margin: '0 0 16px 0',
        color: '#2563eb',
        fontSize: '18px',
        fontWeight: '600'
    },
    sectionDescription: {
        fontSize: '14px',
        color: '#6b7280',
        margin: '0 0 16px 0',
        lineHeight: '1.5'
    },
    thresholdContainer: {
        marginBottom: '16px'
    },
    thresholdLabel: {
        fontSize: '14px',
        color: '#374151',
        lineHeight: '1.6',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexWrap: 'wrap'
    },
    numberInput: {
        width: '60px',
        padding: '6px 8px',
        border: '2px solid #bfdbfe',
        borderRadius: '4px',
        fontSize: '14px',
        textAlign: 'center',
        outline: 'none',
        margin: '0 4px'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '12px',
        cursor: 'pointer',
        padding: '10px',
        borderRadius: '6px',
        transition: 'background-color 0.2s'
    },
    checkbox: {
        marginTop: '3px',
        cursor: 'pointer',
        width: '18px',
        height: '18px',
        accentColor: '#2563eb'
    },
    checkboxText: {
        fontSize: '14px',
        color: '#374151',
        lineHeight: '1.6'
    },
    approverGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
    },
    approverLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
        backgroundColor: '#f8fafc',
        border: '1px solid #bfdbfe',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    approverText: {
        fontSize: '14px',
        color: '#374151',
        fontWeight: '500'
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '24px 30px',
        backgroundColor: '#f8fafc',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px'
    },
    cancelButton: {
        padding: '10px 24px',
        backgroundColor: '#ffffff',
        color: '#2563eb',
        border: '2px solid #2563eb',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s'
    },
    saveButton: {
        padding: '10px 24px',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.2s'
    }
};

export default ApprovalRuleDialog;