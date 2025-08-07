import React from 'react';
import './orgChartPage.scss';

interface Employee {
  id: number;
  name: string;
  title: string;
  location: string;
  avatar: string;
  subType?: string;
  children?: Employee[];
}

const employees: Employee[] = [
  {
    id: 1,
    name: 'Bilel AYACHI',
    title: 'Departement Froid et climatisation',
    location: 'TUN Tunis - Extension',
    avatar: 'https://randomuser.me/api/portraits/men/61.jpg',
    children: [
      {
        id: 2,
        name: 'BALU MAVINGA Jean',
        title: 'Chef de service Chargé de clim-domestique',
        subType: 'UTEX',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/62.jpg',
      },
      {
        id: 3,
        name: 'IKALABA NKOSI Louison',
        title: 'Chef de service Chargé de clim-domestique',
        subType: 'UTEX',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/63.jpg',
      },
      {
        id: 4,
        name: 'MATALATALA WISAMAU Richard',
        title: 'Chef de service Chargé de clim-domestique',
        subType: 'UTEX',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/64.jpg',
      },
      {
        id: 5,
        name: 'MBENZA VUAMISA Willy',
        title: 'Chef de service Chargé de clim-domestique',
        subType: 'SNEL',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/65.jpg',
      },
      {
        id: 6,
        name: 'MFIKA MFUNDU KIMPEMBE Roc',
        title: 'Chef de service Chargé de clim-domestique',
        subType: 'UTEX',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/66.jpg',
      },
      {
        id: 7,
        name: 'TOKO ZABANA Juvénal',
        title: 'Chef de service Chargé de clim-domestique',
        subType: 'UTEX',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      },
      {
        id: 8,
        name: 'KAKUTALUA NGUVU Bienvenu',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/68.jpg',
      },
      {
        id: 9,
        name: 'KAMAKAMA MBALA Joseph',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/69.jpg',
      },
      {
        id: 10,
        name: 'KUMBANA MOYO Beckers',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/70.jpg',
      },
      {
        id: 11,
        name: 'LUVUALU Thomas',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/71.jpg',
      },
      {
        id: 12,
        name: 'MENANKUTIMA NSOMI Marc',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/72.jpg',
      },
      {
        id: 13,
        name: 'MOBATUE MBEMBA Rigaen',
        title: 'Polyvalent',
        subType: 'POLIVALONT',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/73.jpg',
      },
      {
        id: 14,
        name: 'DIANABO KALIMUNDA Marius',
        title: 'Chef de service adj chargé du climatisation centralisé',
        subType: 'PULLMAN',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/74.jpg',
      },
      {
        id: 15,
        name: 'MALONGA KUAMA Isidore',
        title: 'Chef de service adj chargé du climatisation centralisé',
        subType: 'PULLMAN',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
      },
      {
        id: 16,
        name: 'MBIYAVANGA MATALA Antoine',
        title: 'Chef de service adj chargé du climatisation centralisé',
        subType: 'PULLMAN',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/76.jpg',
      },
      {
        id: 17,
        name: 'MUSOMONI KAFUTI Trésor-Benjamin',
        title: 'Chef de service adj chargé du climatisation centralisé',
        subType: 'BCDC',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/77.jpg',
      },
      {
        id: 18,
        name: 'NDOMBASI NGOMBO Diego',
        title: 'Chef de service adj chargé du climatisation centralisé',
        subType: 'BCDC',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/78.jpg',
      },
      {
        id: 19,
        name: 'NTOTO PHUATI Sylvain',
        title: 'Chef de service adj chargé du climatisation centralisé',
        subType: 'BCDC',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/79.jpg',
      },
      {
        id: 20,
        name: 'SADI TONDASE Dodo',
        title: 'Chef de service adj chargé du climatisation centralisé',
        subType: 'BCDC',
        location: 'TUN Tunis - Extension',
        avatar: 'https://randomuser.me/api/portraits/men/80.jpg',
      },
    ],
  },
];

const OrgChartPage = () => {
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
  );
};

export default OrgChartPage;