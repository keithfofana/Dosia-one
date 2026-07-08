import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEmployee } from '../api/employees';
import { BackLink } from '../components/BackLink';
import type { Employee } from '../types/models';

export function EmployeeDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getEmployee(Number(id)).then(setEmployee).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>{t('common.loading')}</p>;
  if (!employee) return <p>{t('employeeDetail.notFound')}</p>;

  return (
    <div>
      <BackLink to="/rh/employees">{t('employeeDetail.backToEmployees')}</BackLink>
      <h1>{employee.name}</h1>
      <p>{employee.position} {employee.hire_date && t('employeeDetail.hiredOn', { date: new Date(employee.hire_date).toLocaleDateString() })}</p>
      <p>{t('employeeDetail.linkedAccount', { name: employee.user?.name ?? '—' })}</p>
      <p>{t('employeeDetail.leaveBalance')} : <span className="badge">{t('employeeDetail.leaveBalanceDays', { days: employee.leave_balance })}</span></p>

      <h2>{t('salaries.title')}</h2>
      <table>
        <thead><tr><th>{t('salaries.month')}</th><th>{t('common.amount')}</th><th>{t('common.status')}</th></tr></thead>
        <tbody>
          {(employee.salaries ?? []).map((s) => (
            <tr key={s.id}>
              <td>{new Date(s.period_month).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}</td>
              <td>{s.amount}</td>
              <td><span className="badge">{t(`salaries.status.${s.status}`)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>{t('attendances.title')}</h2>
      <table>
        <thead><tr><th>{t('common.date')}</th><th>{t('attendances.checkIn')}</th><th>{t('attendances.checkOut')}</th><th>{t('attendances.late')}</th></tr></thead>
        <tbody>
          {(employee.attendances ?? []).map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.date).toLocaleDateString()}</td>
              <td>{a.check_in ?? '—'}</td>
              <td>{a.check_out ?? '—'}</td>
              <td>{a.is_late ? <span className="badge" style={{ color: 'var(--danger)' }}>{t('common.yes')}</span> : t('common.no')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>{t('leaves.title')}</h2>
      <table>
        <thead><tr><th>{t('common.startDate')}</th><th>{t('common.endDate')}</th><th>{t('common.status')}</th></tr></thead>
        <tbody>
          {(employee.leaves ?? []).map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.start_date).toLocaleDateString()}</td>
              <td>{new Date(l.end_date).toLocaleDateString()}</td>
              <td><span className="badge">{t(`leaves.status.${l.status}`)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>{t('contracts.title')}</h2>
      <table>
        <thead><tr><th>{t('common.type')}</th><th>{t('common.startDate')}</th><th>{t('common.endDate')}</th></tr></thead>
        <tbody>
          {(employee.contracts ?? []).map((c) => (
            <tr key={c.id}>
              <td>{c.type}</td>
              <td>{new Date(c.start_date).toLocaleDateString()}</td>
              <td>{c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>{t('evaluations.title')}</h2>
      <table>
        <thead><tr><th>{t('common.date')}</th><th>{t('evaluations.score')}</th><th>{t('evaluations.notes')}</th></tr></thead>
        <tbody>
          {(employee.evaluations ?? []).map((ev) => (
            <tr key={ev.id}>
              <td>{new Date(ev.evaluation_date).toLocaleDateString()}</td>
              <td>{ev.score ?? '—'}</td>
              <td>{ev.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
