import React from 'react';
import { Box } from '@mui/material';
import Layout from '../components/Layout/Layout';
import './orgChartPage.scss';

// Function to generate dummy profile picture using initials
const generateDummyAvatar = (name: string): string => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate a consistent color based on the name
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  const colorIndex = name.length % colors.length;
  const backgroundColor = colors[colorIndex];

  // Create SVG data URL
  const svg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="${backgroundColor}"/>
      <text x="32" y="40" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

interface Employee {
  id: number;
  name: string;
  title: string;
  location: string;
  avatar: string;
  subType?: string;
  children?: Employee[];
}

interface OrgChartPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

const employees: Employee[] = [
  {
    id: 1,
    name: 'Bilel AYACHI',
    title: 'Departement Froid et climatisation',
    location: 'TUN Tunis - Extension',
    avatar: generateDummyAvatar('Bilel AYACHI'),
    children: [
      {
        id: 2,
        name: 'BALU MAVINGA Jean',
        title: 'Chef de service Chargé de clim-domestique',
        subType: 'UTEX',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('BALU MAVINGA Jean'),
      },
      {
        id: 3,
        name: 'IKALABA NKOSI Louison',
        title: 'Chef de service Chargé de clim-domestique',
        subType: 'UTEX',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('IKALABA NKOSI Louison'),
      },
      {
        id: 4,
        name: 'MATALATALA WISAMAU Richard',
        title: 'Chef de service Chargé de clim-domestique',
        subType: 'UTEX',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('MATALATALA WISAMAU Richard'),
      },
      {
        id: 5,
        name: 'MBENZA VUAMISA Willy',
        title: 'Chef de service Chargé de clim-domestique',
        subType: 'SNEL',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('MBENZA VUAMISA Willy'),
      },
      {
        id: 6,
        name: 'MFIKA MFUNDU KIMPEMBE Roc',
        title: 'Chef de service Chargé de clim-domestique',
        subType: 'UTEX',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('MFIKA MFUNDU KIMPEMBE Roc'),
      },
      {
        id: 7,
        name: 'TOKO ZABANA Juvénal',
        title: 'Chef de service Chargé de clim-domestique',
        subType: 'UTEX',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('TOKO ZABANA Juvénal'),
      },
      {
        id: 8,
        name: 'KAKUTALUA NGUVU Bienvenu',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('KAKUTALUA NGUVU Bienvenu'),
      },
      {
        id: 9,
        name: 'KAMAKAMA MBALA Joseph',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('KAMAKAMA MBALA Joseph'),
      },
      {
        id: 10,
        name: 'KUMBANA MOYO Beckers',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('KUMBANA MOYO Beckers'),
      },
      {
        id: 11,
        name: 'LUVUALU Thomas',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('LUVUALU Thomas'),
      },
      {
        id: 12,
        name: 'MAKANDA KABEYA Jean',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('MAKANDA KABEYA Jean'),
      },
      {
        id: 13,
        name: 'MAKANDA KABEYA Jean',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('MAKANDA KABEYA Jean'),
      },
      {
        id: 14,
        name: 'MAKANDA KABEYA Jean',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('MAKANDA KABEYA Jean'),
      },
      {
        id: 15,
        name: 'MAKANDA KABEYA Jean',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('MAKANDA KABEYA Jean'),
      },
      {
        id: 16,
        name: 'MAKANDA KABEYA Jean',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('MAKANDA KABEYA Jean'),
      },
      {
        id: 17,
        name: 'MAKANDA KABEYA Jean',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('MAKANDA KABEYA Jean'),
      },
      {
        id: 18,
        name: 'MAKANDA KABEYA Jean',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('MAKANDA KABEYA Jean'),
      },
      {
        id: 19,
        name: 'MAKANDA KABEYA Jean',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('MAKANDA KABEYA Jean'),
      },
      {
        id: 20,
        name: 'SADI TONDASE Dodo',
        title: 'Chef de service adj chargé du climatisation centralisé',
        subType: 'BCDC',
        location: 'TUN Tunis - Extension',
        avatar: generateDummyAvatar('SADI TONDASE Dodo'),
      },
    ],
  },
];

const OrgChartPage: React.FC<OrgChartPageProps> = ({
  currentPath = '/org-chart',
  onNavigate,
  onLogout
}) => {
  const leader = employees[0];
  const isAdmin = localStorage.getItem('role') === 'admin';

  // Group employees by title
  const climDomestiqueEmployees = leader.children?.filter(emp => emp.title === 'Chef de service Chargé de clim-domestique') || [];
  const polyvalentEmployees = leader.children?.filter(emp => emp.title === 'Polyvalent') || [];
  const climatisationCentraliseEmployees = leader.children?.filter(emp => emp.title === 'Chef de service adj chargé du climatisation centralisé') || [];

  // Function to render employee rows
  const renderEmployeeRows = (employees: Employee[]) => {
    const rows = [];
    for (let i = 0; i < employees.length; i += 2) {
      const row = employees.slice(i, i + 2);
      rows.push(
        <div className="orgchart-row" key={i}>
          {row.map((employee: Employee) => (
            <div className="orgchart-card advisor" key={employee.id}>
              <img src={employee.avatar} alt={employee.name} className="orgchart-avatar" />
              <div className="orgchart-name">{employee.name}</div>
              <div className="orgchart-title">{employee.subType || employee.title}</div>
              <div className="orgchart-location">{employee.location}</div>
            </div>
          ))}
        </div>
      );
    }
    return rows;
  };

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="orgchart-container">
        <div className="orgchart-leader">
          <div className="orgchart-card leader">
            <img src={leader.avatar} alt={leader.name} className="orgchart-avatar leader" />
            <div className="orgchart-name leader">{leader.name}</div>
            <div className="orgchart-title leader">{leader.title}</div>
            <div className="orgchart-location leader">{leader.location}</div>
          </div>
        </div>
        <div className="orgchart-line" />

        <div className="orgchart-sections">
          <div className="orgchart-section">
            <h2 className="orgchart-section-title">Chef de service Chargé de clim-domestique</h2>
            <div className="orgchart-advisors">
              {renderEmployeeRows(climDomestiqueEmployees)}
            </div>
          </div>

          <div className="orgchart-section">
            <h2 className="orgchart-section-title">Polyvalent</h2>
            <div className="orgchart-advisors">
              {renderEmployeeRows(polyvalentEmployees)}
            </div>
          </div>

          <div className="orgchart-section">
            <h2 className="orgchart-section-title">Chef de service adj chargé du climatisation centralisé</h2>
            <div className="orgchart-advisors">
              {renderEmployeeRows(climatisationCentraliseEmployees)}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrgChartPage;