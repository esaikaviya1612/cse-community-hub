import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { get, send, excel } from './api';
import './style.css';

const nav = ['dashboard', 'communities', 'events'];

function App() {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem('user') || 'null')
  );

  const [page, setPage] = useState('dashboard');
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [elections, setElections] = useState([]);

  const load = () =>
    user &&
    Promise.all([
      get('/communities'),
      get(user.role === 'student' ? '/events' : '/events/mine')
    ])
      .then(([c, e]) => {
        setCommunities(c);
        setEvents(e);
      })
      .catch((e) => setMsg(e.message));
  get('/elections')
    .then(setElections)
    .catch(() => { });

  // Message auto-clear
  useEffect(() => {
    if (!msg) return;

    const timer = setTimeout(() => {
      setMsg('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [msg]);

  // Load data

  useEffect(() => {
    load();
  }, [user]);

  useEffect(() => {

    if (!user) return;

    get('/notifications')
      .then(setNotifications)
      .catch(() => { });

  }, [user]);

  if (!user) {
    return (
      <Login
        onLogin={async (e, p) => {
          const x = await send('/auth/login', {
            email: e,
            password: p
          });

          localStorage.setItem('token', x.token);
          localStorage.setItem('user', JSON.stringify(x.user));

          setUser(x.user);
        }}
      />
    );
  }

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside>
        <h2>CSE Hub</h2>

        {nav.map((n) => (
          <button onClick={() => setPage(n)} key={n}>
            {n.charAt(0).toUpperCase() + n.slice(1)}
          </button>
        ))}
        {user.role === 'coordinator' && (
          <>


            <button onClick={() => setPage('myEvents')}>
              My Events
            </button>
            <button onClick={() => setPage('create')}>
              Create Event
            </button>

            <button onClick={() => setPage('registrations')}>
              Registrations
            </button>



            <button
              className={page === 'assignedEnquiries' ? 'active' : ''}
              onClick={() => setPage('assignedEnquiries')}
            >
              Assigned Enquiries
            </button>
          </>
        )}
        {(user.role === 'student' ||
          user.role === 'coordinator') && (
            <button
              className={
                page === 'elections'
                  ? 'active'
                  : ''
              }
              onClick={() => setPage('elections')}
            >
              Elections
            </button>
          )}
        {/* MY PROFILE - ALL USERS */}
        <button
          className={page === 'profile' ? 'active' : ''}
          onClick={() => setPage('profile')}
        >
          My Profile
        </button>

        <button
          className={page === 'notifications' ? 'active' : ''}
          onClick={() => setPage('notifications')}
        >
          Notifications

          {notifications.filter(
            (n) => !n.read
          ).length > 0 && (
              <span className="notification-count">
                {
                  notifications.filter(
                    (n) => !n.read
                  ).length
                }
              </span>
            )}
        </button>



        {/* STUDENT */}
        {user.role === 'student' && (
          <button
            className={page === 'my' ? 'active' : ''}
            onClick={() => setPage('my')}
          >
            My Registrations
          </button>

        )}
        {user.role === 'student' && (
          <button
            className={
              page === 'enquiries'
                ? 'active'
                : ''
            }
            onClick={() => setPage('enquiries')}
          >
            Feedback / Enquiry
          </button>
        )}



        {user.role === 'secretary' && (
          <button onClick={() => setPage('communityManage')}>
            Community Management
          </button>
        )}

        {/* STAFF */}

        {user.role === 'staff' && (
          <>
            <button
              className={page === 'pending' ? 'active' : ''}
              onClick={() => setPage('pending')}
            >
              Pending Events
            </button>

            <button
              className={page === 'manage' ? 'active' : ''}
              onClick={() => setPage('manage')}
            >
              Management
            </button>

            <button
              className={
                page === 'electionManage'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setPage('electionManage')
              }
            >
              Election Management
            </button>
            <button
              className={
                page === 'electionList'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setPage('electionList')
              }
            >
              Elections
            </button>
            <button
              className={page === 'staffEnquiries' ? 'active' : ''}
              onClick={() => setPage('staffEnquiries')}
            >
              Feedback / Enquiries
            </button>
          </>
        )}
        <button
          onClick={() => {
            localStorage.clear();
            setUser(null);
          }}
        >
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main>
        <header>
          <div>
            <h1>CSE Community Hub</h1>
            <small>
              {user.name} · {user.role}
            </small>
          </div>
        </header>

        {msg && (
          <div className="alert">
            {msg}
          </div>
        )}

        {page === 'dashboard' && (
          <Dashboard
            cs={communities}
            es={events}
            open={(p, id) => {
              setPage(p);
              setSelected(id);
            }}
          />
        )}

        {page === 'communities' && (
          <CommunityList
            cs={communities}
            open={(id) => {
              setSelected(id);
              setPage('community');
            }}
          />
        )}

        {page === 'events' && (
          <EventList
            es={events}
            user={user}
            open={(id) => {
              setSelected(id);
              setPage('event');
            }}
          />
        )}

        {page === 'community' && (
          <Community
            id={selected}
            back={() => setPage('communities')}
            open={(id) => {
              setSelected(id);
              setPage('event');
            }}
          />
        )}

        {page === 'event' && (
          <Event
            id={selected}
            user={user}
            back={() => setPage('events')}
            setMsg={setMsg}
            reload={load}
          />
        )}
        {page === 'enquiries' &&
          user.role === 'student' && (
            <EnquiryPage
              setMsg={setMsg}
            />
          )}
        {page === 'staffEnquiries' &&
          user.role === 'staff' && (
            <StaffEnquiryPage setMsg={setMsg} />
          )}

        {page === 'assignedEnquiries' &&
          user.role === 'coordinator' && (
            <CoordinatorEnquiryPage setMsg={setMsg} />
          )}

        {page === 'create' && (
          <Create
            cs={communities}
            user={user}
            back={() => setPage('events')}
            setMsg={setMsg}
            reload={load}
          />
        )}

        {page === 'pending' && (
          <Pending
            setMsg={setMsg}
            open={(id) => {
              setSelected(id);
              setPage('event');
            }}
            reload={load}
          />
        )}

        {page === 'manage' && (
          <Manage
            cs={communities}
            setMsg={setMsg}
          />
        )}
        {page === 'communityManage' && (
          <Manage
            cs={communities}
            setMsg={setMsg}
          />
        )}

        {page === 'myEvents' && (
          <MyEvents
            es={events || []}
            open={(id) => {
              setSelected(id);
              setPage('event');
            }}
            reload={load}
            setMsg={setMsg}
          />
        )}

        {page === 'registrations' && (
          <Registrations
            events={events || []}
            setMsg={setMsg}
          />
        )}

        {page === 'elections' && (
          <ElectionList
            elections={elections}
            setMsg={setMsg}
          />
        )}
        {page === 'electionList' &&
          user.role === 'staff' && (
            <StaffElectionList
              elections={elections}
              setMsg={setMsg}
              reloadElections={() => {
                get('/elections')
                  .then(setElections)
                  .catch(() => { });
              }}
            />
          )}
        {page === 'electionManage' &&
          user.role === 'staff' && (
            <ElectionManagement
              cs={communities}
              setMsg={setMsg}
              reloadElections={() => {
                get('/elections')
                  .then(setElections)
                  .catch(() => { });
              }}
            />
          )}
        {page === 'my' && <My />}

        {/* PROFILE PAGE */}
        {page === 'profile' && (
          <Profile
            user={user}
            setUser={setUser}
            setMsg={setMsg}
          />
        )}

        {page === 'notifications' && (
          <Notifications
            notifications={notifications}
            setNotifications={setNotifications}
          />
        )}
      </main>
    </div>
  );
}


/* =========================================================
   LOGIN
========================================================= */

function Login({ onLogin }) {
  const [e, setE] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  if (showRegister) {
    return (
      <RegisterAccount
        onBack={() => setShowRegister(false)}
        onRegistered={(email) => {
          setE(email);
          setP('');
          setShowRegister(false);
        }}
      />
    );
  }

  const handleLogin = async () => {
    if (!e.trim() || !p.trim()) {
      setErr('Please enter email and password.');
      return;
    }

    try {
      setErr('');
      setLoading(true);

      await onLogin(e, p);

    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="loginbox">

        <b className="logo">CSE</b>

        <h1>CSE Community Hub</h1>

        <input
          type="email"
          value={e}
          onChange={(x) => setE(x.target.value)}
          placeholder="Email"
        />

        <input
          type="password"
          value={p}
          onChange={(x) => setP(x.target.value)}
          placeholder="Password"
        />

        {err && (
          <p className="err">
            {err}
          </p>
        )}

        <button
          className="primary"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p>
          Don't have an account?
        </p>

        <button
          onClick={() => {
            setErr('');
            setShowRegister(true);
          }}
        >
          Create Account
        </button>

      </div>
    </div>
  );
}

/* =========================================================
   REGISTER PAGE
========================================================= */



function RegisterAccount({
  onBack,
  onRegistered
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    registerNo: '',
    department: '',
    year: '',
    gender: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((old) => ({
      ...old,
      [field]: value
    }));
  };

  const register = async () => {

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.registerNo.trim() ||
      !form.department ||
      !form.year ||
      !form.gender
    ) {
      setError('Please fill all fields.');
      return;
    }

    if (form.password.length < 6) {
      setError(
        'Password must be at least 6 characters.'
      );
      return;
    }

    try {
      setError('');
      setLoading(true);

      await send('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        registerNo: form.registerNo.trim(),
        department: form.department,
        year: form.year,
        gender: form.gender
      });

      alert(
        'Account created successfully. Please login.'
      );

      onRegistered(form.email.trim());

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">

      <div className="loginbox">

        <b className="logo">
          CSE
        </b>

        <h1>
          Create Account
        </h1>

        <p>
          Register as a Student
        </p>

        {/* NAME */}

        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) =>
            updateField(
              'name',
              e.target.value
            )
          }
        />

        {/* EMAIL */}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            updateField(
              'email',
              e.target.value
            )
          }
        />

        {/* PASSWORD */}

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            updateField(
              'password',
              e.target.value
            )
          }
        />

        {/* REGISTER NUMBER */}

        <input
          type="text"
          placeholder="Register Number"
          value={form.registerNo}
          onChange={(e) =>
            updateField(
              'registerNo',
              e.target.value
            )
          }
        />

        {/* DEPARTMENT */}

        <select
          value={form.department}
          onChange={(e) =>
            updateField(
              'department',
              e.target.value
            )
          }
        >
          <option value="">
            Select Department
          </option>

          <option value="CSE">
            CSE
          </option>

          <option value="ECE">
            ECE
          </option>

          <option value="EEE">
            EEE
          </option>

          <option value="MECH">
            MECH
          </option>

          <option value="CIVIL">
            CIVIL
          </option>

          <option value="IT">
            IT
          </option>

          <option value="Other">
            Other
          </option>
        </select>

        {/* YEAR */}

        <select
          value={form.year}
          onChange={(e) =>
            updateField(
              'year',
              e.target.value
            )
          }
        >
          <option value="">
            Select Year
          </option>

          <option value="I Year">
            I Year
          </option>

          <option value="II Year">
            II Year
          </option>

          <option value="III Year">
            III Year
          </option>

          <option value="IV Year">
            IV Year
          </option>
        </select>

        {/* GENDER */}

        <select
          value={form.gender}
          onChange={(e) =>
            updateField(
              'gender',
              e.target.value
            )
          }
        >
          <option value="">
            Select Gender
          </option>

          <option value="Female">
            Female
          </option>

          <option value="Male">
            Male
          </option>

          <option value="Other">
            Other
          </option>
        </select>

        {error && (
          <p className="err">
            {error}
          </p>
        )}

        {/* REGISTER */}

        <button
          className="primary"
          onClick={register}
          disabled={loading}
        >
          {loading
            ? 'Creating Account...'
            : 'Create Account'}
        </button>

        {/* BACK */}

        <button
          onClick={() => {
            setError('');
            onBack();
          }}
        >
          Back to Login
        </button>

      </div>

    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  cs,
  es,
  open
}) {

  const approvedEvents =
    (es || [])
      .filter(
        e => e.status === 'approved'
      );


  return (
    <>

      <div className="hero">

        <h2>
          Welcome to the CSE Community Hub
        </h2>

        <p>
          Tech Society and IEI activities,
          events and registrations.
        </p>

      </div>


      {/* =================================================
          COMMUNITIES
      ================================================= */}

      <h2>
        Communities
      </h2>

      <div className="grid">

        {cs.map(c => (

          <Card
            key={c._id}
            title={c.name}
            text={c.description}
            action={() =>
              open(
                'community',
                c._id
              )
            }
          />

        ))}

      </div>


      {/* =================================================
          EVENT POSTERS
      ================================================= */}

      <h2>
        🖼️ Featured Events
      </h2>


      {approvedEvents.length === 0 ? (

        <div className="card">

          <p>
            No event posters available.
          </p>

        </div>

      ) : (

        <div className="poster-grid">

          {approvedEvents
            .slice(0, 6)
            .map(event => (

              <div
                className="event-poster-card"
                key={event._id}
                onClick={() =>
                  open(
                    'event',
                    event._id
                  )
                }
              >

                {event.posterUrl ? (

                  <img
                    src={
                      event.posterUrl.startsWith('http')
                        ? event.posterUrl
                        : `http://localhost:5000${event.posterUrl}`
                    }
                    alt={
                      event.name
                    }
                    className="event-poster-image"
                  />

                ) : (

                  <div className="poster-placeholder">

                    <span>
                      🖼️
                    </span>

                    <p>
                      No poster
                    </p>

                  </div>

                )}


                <div className="event-poster-info">

                  <h3>
                    {event.name}
                  </h3>

                  <p>
                    📅 {event.date}
                  </p>

                  <p>
                    📍 {event.venue}
                  </p>

                  <button
                    onClick={(e) => {

                      e.stopPropagation();

                      open(
                        'event',
                        event._id
                      );

                    }}
                  >
                    View Event
                  </button>

                </div>

              </div>

            ))}

        </div>

      )}


      {/* =================================================
          UPCOMING EVENTS
      ================================================= */}

      <h2>
        📅 Upcoming Events
      </h2>

      <div className="grid">

        {approvedEvents
          .slice(0, 6)
          .map(e => (

            <EventCard
              key={e._id}
              e={e}
              action={() =>
                open(
                  'event',
                  e._id
                )
              }
            />

          ))}

      </div>

    </>
  );
}


/* =========================================================
   COMMUNITY LIST
========================================================= */

function CommunityList({ cs, open }) {
  return (
    <>
      <h2>Communities</h2>

      <div className="grid">
        {cs.map((c) => (
          <Card
            key={c._id}
            title={c.name}
            text={c.description}
            action={() => open(c._id)}
          />
        ))}
      </div>
    </>
  );
}


/* =========================================================
   CARD
========================================================= */

function Card({ title, text, action }) {
  return (
    <div className="card">

      <div className="icon">
        {title.slice(0, 3).toUpperCase()}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

      <button onClick={action}>
        View
      </button>

    </div>
  );
}


/* =========================================================
   EVENT CARD
========================================================= */

function EventCard({ e, action }) {
  return (
    <div className="card">

      <span className={'status ' + e.status}>
        {e.status}
      </span>

      <h3>{e.name}</h3>

      <p>
        {e.communityId?.name}
      </p>

      <p>
        📅 {e.date} · ⏰ {e.time}
      </p>

      <p>
        📍 {e.venue}
      </p>

      <p>
        {e.registrationType === 'team'
          ? 'Team'
          : 'Individual'}
        {' · '}
        {e.minParticipants}-{e.maxParticipants}
      </p>

      <button onClick={action}>
        View Details
      </button>

    </div>
  );
}
/* =========================================================
   STAFF ELECTION LIST
========================================================= */

function StaffElectionList({
  elections,
  setMsg,
  reloadElections
}) {
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] =
    useState(false);

  const closeElection = async (id) => {

    const confirmClose = window.confirm(
      'Are you sure you want to close this election? Voting will stop.'
    );

    if (!confirmClose) return;

    try {

      await send(
        `/elections/${id}/close`,
        {},
        'PATCH'
      );

      setMsg('Election closed successfully.');

      reloadElections();

    } catch (e) {
      setMsg(e.message);
    }
  };


  const viewResults = async (id) => {

    setLoadingResults(true);

    try {

      const data =
        await get(`/elections/${id}/results`);

      setResults(data);

    } catch (e) {

      setMsg(e.message);

    } finally {

      setLoadingResults(false);
    }
  };


  if (results) {

    return (
      <div className="page">

        <button
          onClick={() => setResults(null)}
        >
          ← Back to Elections
        </button>

        <h2>
          📊 Election Results
        </h2>

        <h3>
          {results.election}
        </h3>

        {results.results.map(
          (position) => (

            <div
              className="card"
              key={position.position}
            >

              <h3>
                {position.position}
              </h3>

              {position.candidates
                .sort(
                  (a, b) =>
                    b.votes - a.votes
                )
                .map(
                  (candidate) => (

                    <div
                      key={
                        candidate.candidateId
                      }
                      style={{
                        padding: '10px',
                        borderBottom:
                          '1px solid #ddd'
                      }}
                    >

                      <strong>
                        {candidate.name}
                      </strong>

                      <span>
                        {' '}
                        —{' '}
                        {candidate.registerNo}
                      </span>

                      <span
                        style={{
                          float: 'right'
                        }}
                      >
                        🗳️{' '}
                        {candidate.votes}{' '}
                        votes
                      </span>

                    </div>

                  )
                )}

            </div>

          )
        )}

      </div>
    );
  }


  return (
    <div className="page">

      <h2>
        📋 Existing Elections
      </h2>

      {elections.length === 0 ? (

        <div className="card">

          <p>
            No elections created yet.
          </p>

        </div>

      ) : (

        elections.map(
          (election) => (

            <div
              className="card"
              key={election._id}
              style={{
                marginBottom: '15px'
              }}
            >

              <h3>
                {election.title}
              </h3>

              <p>
                Community:{' '}
                {election.communityId?.name}
              </p>

              <p>
                Status:{' '}

                <strong>
                  {election.status
                    .toUpperCase()}
                </strong>
              </p>

              <p>
                Positions:{' '}
                {election.positions?.length || 0}
              </p>

              <div>

                <button
                  onClick={() =>
                    viewResults(
                      election._id
                    )
                  }
                >
                  📊 View Results
                </button>

                {election.status ===
                  'active' && (

                    <button
                      onClick={() =>
                        closeElection(
                          election._id
                        )
                      }
                      style={{
                        marginLeft: '10px'
                      }}
                    >
                      🔒 Close Election
                    </button>

                  )}

              </div>

            </div>

          )
        )

      )}

    </div>
  );
}


/* =========================================================
   EVENT LIST
========================================================= */

function EventList({ es, user, open }) {
  return (
    <>
      <div className="title">
        <h2>
          {user.role === 'student'
            ? 'Approved Events'
            : 'My Events'}
        </h2>
      </div>

      <div className="grid">
        {es.map((e) => (
          <EventCard
            key={e._id}
            e={e}
            action={() => open(e._id)}
          />
        ))}
      </div>
    </>
  );
}

function MyEvents({ es = [], open, reload, setMsg }) {
  const removeEvent = async (id) => {
    const ok = window.confirm(
      'Are you sure you want to delete this event?'
    );

    if (!ok) return;

    try {
      await send(`/events/${id}`, {}, 'DELETE');
      setMsg('Event deleted successfully.');
      await reload();
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <>
      <div className="title">
        <div>
          <h2>My Events</h2>
          <p>Events created by you</p>
        </div>
      </div>

      {es.length === 0 ? (
        <div className="card">
          <h3>No Events Created</h3>
          <p>You have not created any events yet.</p>
        </div>
      ) : (
        <div className="grid">
          {es.map((e) => (
            <div className="card" key={e._id}>
              <h3>{e.name}</h3>

              <p>
                <b>Community:</b>{' '}
                {e.communityId?.name || 'Not specified'}
              </p>

              <p>
                <b>Date:</b> {e.date}
              </p>

              <p>
                <b>Time:</b> {e.time}
              </p>

              <p>
                <b>Venue:</b> {e.venue}
              </p>

              <p>
                <b>Status:</b> {e.status?.toUpperCase()}
              </p>

              {e.status === 'rejected' && e.rejectionReason && (
                <p>
                  <b>Rejection Reason:</b>{' '}
                  {e.rejectionReason}
                </p>
              )}

              <button onClick={() => open(e._id)}>
                View Details
              </button>

              <button onClick={() => removeEvent(e._id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* =========================================================
   COORDINATOR REGISTRATIONS
========================================================= */

function Registrations({ events, setMsg }) {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRegistrations = async (eventId) => {
    if (!eventId) {
      setRegistrations([]);
      return;
    }

    try {
      setLoading(true);

      const data = await get(
        `/events/${eventId}/registrations`
      );

      setRegistrations(data);
    } catch (error) {
      setMsg(error.message);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventId) => {
    setSelectedEvent(eventId);
    loadRegistrations(eventId);
  };

  const selected = events.find(
    (e) => e._id === selectedEvent
  );

  return (
    <>
      <div className="title">
        <div>
          <h2>Registrations</h2>
          <p>View registrations for your events</p>
        </div>
      </div>

      <div className="card">

        <label>
          Select Event
        </label>

        <select
          value={selectedEvent}
          onChange={(e) => handleEventChange(e.target.value)}
        >
          <option value="">-- Select Event --</option>

          {(events || []).map((event) => (
            <option key={event._id} value={event._id}>
              {event.name}
            </option>
          ))}
        </select>

      </div>

      {!selectedEvent && (
        <div className="card">
          <p>
            Select an event to view its registrations.
          </p>
        </div>
      )}

      {selectedEvent && (
        <>
          {selected && (
            <div className="card">
              <h3>{selected.name}</h3>

              <p>
                <b>Community:</b>{' '}
                {selected.communityId?.name}
              </p>

              <p>
                <b>Date:</b> {selected.date}
              </p>

              <p>
                <b>Time:</b> {selected.time}
              </p>

              <p>
                <b>Venue:</b> {selected.venue}
              </p>

              <p>
                <b>Registration Type:</b>{' '}
                {selected.registrationType}
              </p>

              <p>
                <b>Total Registrations:</b>{' '}
                {registrations.length}
              </p>
              <button
                className="primary"
                onClick={async () => {
                  try {
                    await excel(selectedEvent);
                  } catch (e) {
                    setMsg(e.message);
                  }
                }}
              >
                Download Excel
              </button>
            </div>
          )}

          {loading ? (
            <div className="card">
              <p>Loading registrations...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="card">
              <h3>No Registrations</h3>
              <p>
                No students have registered for this event yet.
              </p>
            </div>
          ) : (
            <div className="grid">

              {registrations.map((r, index) => (
                <div
                  className="card registration-card"
                  key={r._id}
                >

                  <h3>
                    Registration #{index + 1}
                  </h3>

                  {r.registrationType === 'team' ? (
                    <>
                      <p>
                        <b>Registration Type:</b> Team
                      </p>

                      <p>
                        <b>Team Name:</b>{' '}
                        {r.teamName || 'Unnamed Team'}
                      </p>

                      <hr />

                      <h4>Team Members</h4>

                      <div className="team-members">

                        {r.members?.map(
                          (member, memberIndex) => (
                            <div
                              className="team-member"
                              key={memberIndex}
                            >
                              <p>
                                <b>
                                  Member {memberIndex + 1}
                                </b>
                              </p>

                              <p>
                                <b>Name:</b>{' '}
                                {member.name || '-'}
                              </p>

                              <p>
                                <b>Register No:</b>{' '}
                                {member.registerNo || '-'}
                              </p>

                              <p>
                                <b>Class:</b>{' '}
                                {member.className || '-'}
                              </p>

                              <p>
                                <b>Year:</b>{' '}
                                {member.year || '-'}
                              </p>

                              <p>
                                <b>Email:</b>{' '}
                                {member.email || '-'}
                              </p>
                            </div>
                          )
                        )}

                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        <b>Registration Type:</b> Individual
                      </p>

                      <hr />

                      <h4>Student Details</h4>

                      <p>
                        <b>Name:</b>{' '}
                        {r.studentId?.name || '-'}
                      </p>

                      <p>
                        <b>Email:</b>{' '}
                        {r.studentId?.email || '-'}
                      </p>

                      <p>
                        <b>Register No:</b>{' '}
                        {r.studentId?.registerNo || '-'}
                      </p>

                      <p>
                        <b>Department:</b>{' '}
                        {r.studentId?.department || '-'}
                      </p>

                      <p>
                        <b>Year:</b>{' '}
                        {r.studentId?.year || '-'}
                      </p>

                      <p>
                        <b>Gender:</b>{' '}
                        {r.studentId?.gender || '-'}
                      </p>
                    </>
                  )}

                </div>
              ))}

            </div>
          )}
        </>
      )}
    </>
  );
}
/* =========================================================
   COMMUNITY DETAILS
========================================================= */

function Community({ id, back, open }) {
  const [d, setD] = useState(null);
  const [es, setEs] = useState([]);

  useEffect(() => {
    Promise.all([
      get(`/communities/${id}`),
      get(`/events?communityId=${id}`)
    ]).then(([a, b]) => {
      setD(a);
      setEs(b);
    });
  }, [id]);

  if (!d) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <button onClick={back}>
        ← Back
      </button>

      <div className="hero">

        <h2>
          {d.community.name}
        </h2>

        <p>
          {d.community.description}
        </p>

        <p>
          {d.community.activities}
        </p>

      </div>

      <h2>Office Bearers</h2>

      <div className="people">

        {d.bearers.map((b) => (
          <div
            className="person"
            key={b._id}
          >

            {b.photoUrl ? (
              <img
                src={b.photoUrl}
                alt={b.name}
              />
            ) : (
              <div className="avatar">
                {b.name[0]}
              </div>
            )}

            <b>
              {b.roleName}
            </b>

            <span>
              {b.name}
            </span>

            <small>
              {b.year} · {b.className}
            </small>

          </div>
        ))}

      </div>

      <h2>Coordinators</h2>

      <div className="chips">
        {d.coordinators.map((x) => (
          <span key={x._id}>
            {x.name}
          </span>
        ))}
      </div>

      <h2>Approved Events</h2>

      <div className="grid">
        {es.map((e) => (
          <EventCard
            key={e._id}
            e={e}
            action={() => open(e._id)}
          />
        ))}
      </div>
    </>
  );
}


/* =========================================================
   EVENT DETAILS
========================================================= */

function Event({
  id,
  user,
  back,
  setMsg,
  reload
}) {
  const [e, setE] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    get(`/events/${id}`)
      .then(setE)
      .catch((x) => setMsg(x.message));
  }, [id]);

  if (!e) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <button onClick={back}>
        ← Back
      </button>

      <div className="card detail">

        <span className={'status ' + e.status}>
          {e.status}
        </span>

        <h2>{e.name}</h2>

        <p>
          <b>Community:</b>{' '}
          {e.communityId?.name}
        </p>

        <p>
          📅 {e.date} · ⏰ {e.time}
        </p>

        <p>
          📍 {e.venue}
        </p>

        <p>
          <b>Organizer:</b>{' '}
          {e.organizer}
        </p>

        <p>
          <b>Faculty Coordinator:</b>{' '}
          {e.facultyCoordinator}
        </p>

        <p>
          <b>Student Coordinator:</b>{' '}
          {e.studentCoordinator}
        </p>

        <p>
          {e.description}
        </p>

        <hr />

        <p>
          <b>Registration:</b>{' '}
          {e.registrationType}{' '}
          ({e.minParticipants}-
          {e.maxParticipants})
        </p>

        {e.status === 'rejected' && (
          <p className="err">
            Reason: {e.rejectionReason}
          </p>
        )}

        {user.role === 'student' &&
          e.status === 'approved' && (
            <button
              className="primary"
              onClick={() => setShow(true)}
            >
              Register
            </button>
          )}

        {show && (
          <Register
            e={e}
            close={() => setShow(false)}
            setMsg={setMsg}
            reload={reload}
          />
        )}

      </div>
    </>
  );
}


/* =========================================================
   REGISTRATION
========================================================= */

function Register({
  e,
  close,
  setMsg,
  reload
}) {
  const [team, setTeam] = useState(
    Array.from(
      {
        length: e.maxParticipants
      },
      () => ({
        name: '',
        registerNo: '',
        className: '',
        year: '',
        email: ''
      })
    )
  );

  const [tn, setTn] = useState('');

  const submit = async () => {
    try {

      if (e.registrationType === 'individual') {

        await send(
          `/events/${e._id}/register`,
          {
            registrationType: 'individual'
          }
        );

      } else {

        await send(
          `/events/${e._id}/register`,
          {
            registrationType: 'team',
            teamName: tn,
            members: team
          }
        );
      }

      setMsg('Registration successful.');
      close();
      reload();

    } catch (x) {
      setMsg(x.message);
    }
  };

  return (
    <div className="modal">

      <div className="modalbox">

        <h3>
          {e.registrationType === 'team'
            ? 'Team Registration'
            : 'Event Registration'}
        </h3>

        {e.registrationType === 'team' ? (
          <>
            <input
              placeholder="Team Name"
              value={tn}
              onChange={(x) =>
                setTn(x.target.value)
              }
            />

            {team.map((m, i) => (
              <div
                className="member"
                key={i}
              >

                <b>
                  Member {i + 1}
                </b>

                {Object.keys(m).map((k) => (
                  <input
                    key={k}
                    placeholder={k}
                    value={m[k]}
                    onChange={(x) =>
                      setTeam(
                        team.map((z, j) =>
                          j === i
                            ? {
                              ...z,
                              [k]: x.target.value
                            }
                            : z
                        )
                      )
                    }
                  />
                ))}

              </div>
            ))}
          </>
        ) : (
          <p>
            Your student profile details will be used.
          </p>
        )}

        <button onClick={close}>
          Cancel
        </button>

        <button
          className="primary"
          onClick={submit}
        >
          Submit
        </button>

      </div>
    </div>
  );
}

function ElectionList({ elections, setMsg }) {

  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <ElectionVote
        election={selected}
        setMsg={setMsg}
        back={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="page">

      <h2>🗳️ Elections</h2>

      {elections.length === 0 ? (
        <p>No active elections available.</p>
      ) : (
        elections.map(election => (
          <div className="card" key={election._id}>

            <h3>{election.title}</h3>

            <p>
              Community: {election.communityId?.name}
            </p>

            <button onClick={() => setSelected(election)}>
              Vote Now
            </button>

          </div>
        ))
      )}

    </div>
  );
}

function ElectionVote({ election, setMsg, back }) {

  const [votes, setVotes] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    get(`/elections/${election._id}/my-votes`)
      .then(data => {

        const selected = {};
        const done = {};

        data.forEach(v => {
          selected[v.position] = v.candidateId;
          done[v.position] = true;
        });

        setVotes(selected);
        setSubmitted(done);

      })
      .catch(() => { });

  }, [election._id]);


  const submitVote = async (position) => {

    const candidateId = votes[position];

    if (!candidateId) {
      setMsg('Please select a candidate.');
      return;
    }

    const confirmVote = window.confirm(
      `Once you submit your vote for ${position}, it cannot be changed.\n\nDo you want to continue?`
    );

    if (!confirmVote) return;

    setLoading(true);

    try {

      await send(`/elections/${election._id}/vote`, {
        position,
        candidateId
      });

      setSubmitted(prev => ({
        ...prev,
        [position]: true
      }));

      setMsg(
        `Your vote for ${position} has been finalized 🔒`
      );

    } catch (e) {

      setMsg(e.message);

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="page">

      <button onClick={back}>
        ← Back
      </button>

      <h2>{election.title}</h2>

      <p>
        Community: {election.communityId?.name}
      </p>


      {election.positions.map(position => (

        <div className="card" key={position._id}>

          <h3>{position.name}</h3>

          {position.candidates.map(candidate => (

            <label
              key={candidate._id}
              style={{
                display: 'block',
                margin: '12px 0'
              }}
            >

              <input
                type="radio"
                name={position.name}
                value={candidate._id}
                checked={
                  votes[position.name] ===
                  candidate._id
                }
                disabled={submitted[position.name]}
                onChange={() =>
                  setVotes(prev => ({
                    ...prev,
                    [position.name]: candidate._id
                  }))
                }
              />

              {' '}

              <strong>{candidate.name}</strong>

              {' — '}

              {candidate.registerNo}

            </label>

          ))}


          {submitted[position.name] ? (

            <p>
              🔒 <strong>Vote Finalized</strong>
              <br />
              You cannot change your vote.
            </p>

          ) : (

            <button
              onClick={() =>
                submitVote(position.name)
              }
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'VOTE'}
            </button>

          )}

        </div>

      ))}

    </div>
  );
}


/* =========================================================
   CREATE EVENT
========================================================= */

function Create({
  cs,
  user,
  back,
  setMsg,
  reload
}) {
  const [f, setF] = useState({
    communityId: cs[0]?._id || '',
    name: '',
    date: '',
    time: '10:00',
    venue: '',
    description: '',
    organizer: user.name,
    facultyCoordinator: '',
    studentCoordinator: user.name,
    registrationRequired: true,
    registrationType: 'individual',
    minParticipants: 1,
    maxParticipants: 1,
    registrationDeadline: ''
  });
 const [poster, setPoster] = useState(null);
  const u = (k, v) =>
    setF({
      ...f,
      [k]: v
    });

  return (
    <>
      <h2>Create Event</h2>

      <div className="form card">

        {[
          ['name', 'Event Name'],
          ['date', 'Date'],
          ['time', 'Time'],
          ['venue', 'Venue'],
          ['organizer', 'Organizer'],
          [
            'facultyCoordinator',
            'Faculty Coordinator'
          ],
          [
            'studentCoordinator',
            'Student Coordinator'
          ],
          [
            'registrationDeadline',
            'Registration Deadline'
          ]
        ].map(([k, l]) => (
          <label key={k}>
            {l}

            <input
              type={
                k === 'date' ||
                  k === 'registrationDeadline'
                  ? 'date'
                  : k === 'time'
                    ? 'time'
                    : 'text'
              }
              value={f[k]}
              onChange={(x) =>
                u(k, x.target.value)
              }
            />
          </label>
        ))}

        <label>
          Community

          <select
            value={f.communityId}
            onChange={(x) =>
              u('communityId', x.target.value)
            }
          >
            {cs.map((c) => (
              <option
                key={c._id}
                value={c._id}
              >
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Description

          <textarea
            value={f.description}
            onChange={(x) =>
              u('description', x.target.value)
            }
          />
        </label>
        <label>
          Event Poster

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {

              const file =
                e.target.files?.[0];

              if (!file) return;


              if (
                ![
                  'image/jpeg',
                  'image/png',
                  'image/webp'
                ].includes(file.type)
              ) {

                setMsg(
                  'Only JPG, PNG and WEBP images are allowed.'
                );

                e.target.value = '';

                return;
              }


              if (
                file.size >
                5 * 1024 * 1024
              ) {

                setMsg(
                  'Poster must be less than 5 MB.'
                );

                e.target.value = '';

                return;
              }


              setPoster(file);

            }}
          />

          <small>
            JPG, PNG or WEBP • Maximum 5 MB
          </small>

        </label>

        <label>
          Registration Type

          <select
            value={f.registrationType}
            onChange={(x) => {
              u(
                'registrationType',
                x.target.value
              );

              if (
                x.target.value ===
                'individual'
              ) {
                u(
                  'minParticipants',
                  1
                );

                u(
                  'maxParticipants',
                  1
                );
              }
            }}
          >
            <option value="individual">
              Individual
            </option>

            <option value="team">
              Team
            </option>
          </select>
        </label>

        {f.registrationType === 'team' && (
          <div className="two">

            <label>
              Minimum

              <input
                type="number"
                value={f.minParticipants}
                onChange={(x) =>
                  u(
                    'minParticipants',
                    +x.target.value
                  )
                }
              />
            </label>

            <label>
              Maximum

              <input
                type="number"
                value={f.maxParticipants}
                onChange={(x) =>
                  u(
                    'maxParticipants',
                    +x.target.value
                  )
                }
              />
            </label>

          </div>
        )}

        <button
  className="primary"
  onClick={async () => {

    try {

      if (!f.name.trim()) {

        setMsg(
          'Please enter event name.'
        );

        return;
      }


      if (!f.communityId) {

        setMsg(
          'Please select community.'
        );

        return;
      }


      const formData =
        new FormData();


      Object.entries(f).forEach(
        ([key, value]) => {

          formData.append(
            key,
            value
          );

        }
      );


      if (poster) {

        formData.append(
          'poster',
          poster
        );

      }


      await send(
        '/events',
        formData
      );


      setMsg(
        'Event submitted for Staff approval.'
      );


      await reload();

      back();

    } catch (x) {

      setMsg(
        x.message
      );

    }

  }}
>
  Submit for Approval
</button>

      </div>
    </>
  );
}


/* =========================================================
   PENDING EVENTS
========================================================= */

function Pending({
  setMsg,
  open,
  reload
}) {
  const [x, setX] = useState([]);

  const load = () =>
    get('/events/pending')
      .then(setX);

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <h2>Pending Events</h2>

      <div className="grid">

        {x.map((e) => (
          <div
            className="card"
            key={e._id}
          >

            <span className="status pending">
              pending
            </span>

            <h3>{e.name}</h3>

            <p>
              {e.communityId?.name}
              {' · '}
              {e.createdBy?.name}
            </p>

            <button
              onClick={() => open(e._id)}
            >
              View
            </button>

            <button
              className="primary"
              onClick={async () => {

                await send(
                  `/events/${e._id}/approve`,
                  {},
                  'PATCH'
                );

                setMsg(
                  'Event approved.'
                );

                load();
                reload();
              }}
            >
              Approve
            </button>

            <button
              className="danger"
              onClick={async () => {

                const reason =
                  prompt(
                    'Rejection reason'
                  );

                if (reason) {

                  await send(
                    `/events/${e._id}/reject`,
                    {
                      reason
                    },
                    'PATCH'
                  );

                  setMsg(
                    'Event rejected.'
                  );

                  load();
                  reload();
                }
              }}
            >
              Reject
            </button>

          </div>
        ))}

      </div>
    </>
  );
}


/* =========================================================
   MANAGEMENT
========================================================= */

function Manage({ cs, setMsg }) {
  const [communityId, setCommunityId] = useState(
    cs[0]?._id || ''
  );

  const [data, setData] = useState(null);

  const [allCoordinators, setAllCoordinators] = useState([]);

  const [roleName, setRoleName] = useState('');

  const [editingRole, setEditingRole] = useState(null);
  const [editRoleName, setEditRoleName] = useState('');

  const [showBearerForm, setShowBearerForm] = useState(false);

  const [bearerForm, setBearerForm] = useState({
    roleId: '',
    roleName: '',
    name: '',
    year: '',
    className: '',
    photoUrl: '',
    bio: ''
  });

  const [editingBearer, setEditingBearer] = useState(null);

  const [showCoordinatorForm, setShowCoordinatorForm] =
    useState(false);

  const [selectedCoordinator, setSelectedCoordinator] =
    useState('');

  /* =====================================================
     LOAD SELECTED COMMUNITY
  ===================================================== */

  async function loadCommunity() {
    if (!communityId) return;

    try {
      const result = await get(
        `/communities/${communityId}`
      );

      setData(result);
    } catch (error) {
      setMsg(error.message);
    }
  }

  /* =====================================================
     LOAD ALL COORDINATORS
  ===================================================== */

  async function loadCoordinators() {
    try {
      const result = await get(
        '/communities/users/coordinators'
      );

      setAllCoordinators(result);
    } catch (error) {
      setMsg(error.message);
    }
  }

  useEffect(() => {
    loadCommunity();
  }, [communityId]);

  useEffect(() => {
    loadCoordinators();
  }, []);

  /* =====================================================
     ADD ROLE
  ===================================================== */

  async function addRole() {
    if (!roleName.trim()) {
      setMsg('Enter a role name.');
      return;
    }

    try {
      await send(
        `/communities/${communityId}/roles`,
        {
          name: roleName.trim(),
          displayOrder: data.roles.length
        }
      );

      setRoleName('');

      setMsg('Role added successfully.');

      await loadCommunity();

    } catch (error) {
      setMsg(error.message);
    }
  }

  /* =====================================================
     EDIT ROLE
  ===================================================== */

  function startEditRole(role) {
    setEditingRole(role._id);
    setEditRoleName(role.name);
  }

  async function updateRole(roleId) {
    if (!editRoleName.trim()) {
      setMsg('Role name cannot be empty.');
      return;
    }

    try {
      await send(
        `/communities/roles/${roleId}`,
        {
          name: editRoleName.trim()
        },
        'PUT'
      );

      setEditingRole(null);
      setEditRoleName('');

      setMsg('Role updated successfully.');

      await loadCommunity();

    } catch (error) {
      setMsg(error.message);
    }
  }

  /* =====================================================
     DELETE ROLE
  ===================================================== */

  async function deleteRole(roleId) {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this role?'
    );

    if (!confirmDelete) return;

    try {
      await send(
        `/communities/roles/${roleId}`,
        {},
        'DELETE'
      );

      setMsg('Role deleted successfully.');

      await loadCommunity();

    } catch (error) {
      setMsg(error.message);
    }
  }

  /* =====================================================
     BEARER FORM
  ===================================================== */

  function updateBearerField(field, value) {
    setBearerForm({
      ...bearerForm,
      [field]: value
    });
  }

  function selectBearerRole(role) {
    setBearerForm({
      ...bearerForm,
      roleId: role._id,
      roleName: role.name
    });
  }

  /* =====================================================
     ADD OFFICE BEARER
  ===================================================== */

  async function addBearer() {
    if (
      !bearerForm.name.trim() ||
      !bearerForm.roleId
    ) {
      setMsg(
        'Please select a role and enter bearer name.'
      );
      return;
    }

    try {
      await send(
        `/communities/${communityId}/bearers`,
        {
          roleId: bearerForm.roleId,
          roleName: bearerForm.roleName,
          name: bearerForm.name,
          year: bearerForm.year,
          className: bearerForm.className,
          photoUrl: bearerForm.photoUrl,
          bio: bearerForm.bio,
          displayOrder: data.bearers.length
        }
      );

      setBearerForm({
        roleId: '',
        roleName: '',
        name: '',
        year: '',
        className: '',
        photoUrl: '',
        bio: ''
      });

      setShowBearerForm(false);

      setMsg(
        'Office bearer added successfully.'
      );

      await loadCommunity();

    } catch (error) {
      setMsg(error.message);
    }
  }

  /* =====================================================
     EDIT OFFICE BEARER
  ===================================================== */

  function startEditBearer(bearer) {
    setEditingBearer(bearer._id);

    setBearerForm({
      roleId: bearer.roleId || '',
      roleName: bearer.roleName || '',
      name: bearer.name || '',
      year: bearer.year || '',
      className: bearer.className || '',
      photoUrl: bearer.photoUrl || '',
      bio: bearer.bio || ''
    });
  }

  async function updateBearer(bearerId) {
    if (
      !bearerForm.name.trim() ||
      !bearerForm.roleId
    ) {
      setMsg(
        'Please select a role and enter bearer name.'
      );
      return;
    }

    try {
      await send(
        `/communities/bearers/${bearerId}`,
        {
          roleId: bearerForm.roleId,
          roleName: bearerForm.roleName,
          name: bearerForm.name,
          year: bearerForm.year,
          className: bearerForm.className,
          photoUrl: bearerForm.photoUrl,
          bio: bearerForm.bio
        },
        'PUT'
      );

      setEditingBearer(null);

      setBearerForm({
        roleId: '',
        roleName: '',
        name: '',
        year: '',
        className: '',
        photoUrl: '',
        bio: ''
      });

      setMsg(
        'Office bearer updated successfully.'
      );

      await loadCommunity();

    } catch (error) {
      setMsg(error.message);
    }
  }

  /* =====================================================
     DELETE OFFICE BEARER
  ===================================================== */

  async function deleteBearer(bearerId) {
    const confirmDelete = window.confirm(
      'Delete this office bearer?'
    );

    if (!confirmDelete) return;

    try {
      await send(
        `/communities/bearers/${bearerId}`,
        {},
        'DELETE'
      );

      setMsg(
        'Office bearer deleted successfully.'
      );

      await loadCommunity();

    } catch (error) {
      setMsg(error.message);
    }
  }

  /* =====================================================
     ADD COORDINATOR
  ===================================================== */

  async function addCoordinator() {
    if (!selectedCoordinator) {
      setMsg('Please select a coordinator.');
      return;
    }

    try {
      await send(
        `/communities/${communityId}/coordinators`,
        {
          userId: selectedCoordinator
        }
      );

      setSelectedCoordinator('');
      setShowCoordinatorForm(false);

      setMsg(
        'Coordinator added successfully.'
      );

      await loadCommunity();

    } catch (error) {
      setMsg(error.message);
    }
  }

  /* =====================================================
     REMOVE COORDINATOR
  ===================================================== */

  async function removeCoordinator(userId) {
    const confirmDelete = window.confirm(
      'Remove this coordinator from the community?'
    );

    if (!confirmDelete) return;

    try {
      await send(
        `/communities/${communityId}/coordinators/${userId}`,
        {},
        'DELETE'
      );

      setMsg(
        'Coordinator removed successfully.'
      );

      await loadCommunity();

    } catch (error) {
      setMsg(error.message);
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (!data) {
    return (
      <div>
        <h2>Management</h2>

        <select
          value={communityId}
          onChange={(e) =>
            setCommunityId(e.target.value)
          }
        >
          {cs.map((community) => (
            <option
              key={community._id}
              value={community._id}
            >
              {community.name}
            </option>
          ))}
        </select>

        <p>Loading...</p>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div>

      <h2>Management</h2>

      {/* COMMUNITY SELECT */}

      <label>
        Community

        <select
          value={communityId}
          onChange={(e) =>
            setCommunityId(e.target.value)
          }
        >
          {cs.map((community) => (
            <option
              key={community._id}
              value={community._id}
            >
              {community.name}
            </option>
          ))}
        </select>
      </label>


      <div className="manage">


        {/* =================================================
            OFFICE BEARER ROLES
        ================================================= */}

        <div className="card">

          <h3>
            Office Bearer Roles
          </h3>

          {data.roles.length === 0 && (
            <p>
              No roles added yet.
            </p>
          )}

          {data.roles.map((role) => (

            <div
              key={role._id}
              className="manage-row"
            >

              {editingRole === role._id ? (

                <>
                  <input
                    value={editRoleName}
                    onChange={(e) =>
                      setEditRoleName(
                        e.target.value
                      )
                    }
                  />

                  <button
                    className="primary"
                    onClick={() =>
                      updateRole(role._id)
                    }
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setEditingRole(null);
                      setEditRoleName('');
                    }}
                  >
                    Cancel
                  </button>
                </>

              ) : (

                <>
                  <span>
                    {role.name}
                  </span>

                  <button
                    onClick={() =>
                      startEditRole(role)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="danger"
                    onClick={() =>
                      deleteRole(role._id)
                    }
                  >
                    Delete
                  </button>
                </>

              )}

            </div>

          ))}


          <div className="manage-add">

            <input
              placeholder="New role"
              value={roleName}
              onChange={(e) =>
                setRoleName(e.target.value)
              }
            />

            <button
              className="primary"
              onClick={addRole}
            >
              Add Role
            </button>

          </div>

        </div>


        {/* =================================================
            OFFICE BEARERS
        ================================================= */}

        <div className="card">

          <h3>
            Office Bearers
          </h3>

          {data.bearers.length === 0 && (
            <p>
              No office bearers added yet.
            </p>
          )}


          {data.bearers.map((bearer) => (

            <div
              key={bearer._id}
              className="bearer-item"
            >

              {bearer.photoUrl ? (

                <img
                  src={bearer.photoUrl}
                  alt={bearer.name}
                  className="bearer-photo"
                />

              ) : (

                <div className="bearer-avatar">
                  {bearer.name
                    ?.charAt(0)
                    ?.toUpperCase() || 'U'}
                </div>

              )}


              <div className="bearer-info">

                <strong>
                  {bearer.name}
                </strong>

                <span>
                  {bearer.roleName}
                </span>

                <small>
                  {bearer.year || '-'}
                  {' · '}
                  {bearer.className || '-'}
                </small>

                {bearer.bio && (
                  <small>
                    {bearer.bio}
                  </small>
                )}

              </div>


              <div className="manage-actions">

                <button
                  onClick={() =>
                    startEditBearer(bearer)
                  }
                >
                  Edit
                </button>

                <button
                  className="danger"
                  onClick={() =>
                    deleteBearer(bearer._id)
                  }
                >
                  Delete
                </button>

              </div>

            </div>

          ))}


          {/* ADD / EDIT BEARER FORM */}

          {(showBearerForm ||
            editingBearer) && (

              <div className="bearer-form">

                <h4>
                  {editingBearer
                    ? 'Edit Office Bearer'
                    : 'Add Office Bearer'}
                </h4>


                <label>
                  Role

                  <select
                    value={bearerForm.roleId}
                    onChange={(e) => {

                      const selectedRole =
                        data.roles.find(
                          (r) =>
                            r._id ===
                            e.target.value
                        );

                      if (selectedRole) {
                        selectBearerRole(
                          selectedRole
                        );
                      }

                    }}
                  >

                    <option value="">
                      Select Role
                    </option>

                    {data.roles.map((role) => (

                      <option
                        key={role._id}
                        value={role._id}
                      >
                        {role.name}
                      </option>

                    ))}

                  </select>

                </label>


                <label>
                  Name

                  <input
                    value={bearerForm.name}
                    onChange={(e) =>
                      updateBearerField(
                        'name',
                        e.target.value
                      )
                    }
                  />

                </label>


                <label>
                  Year

                  <input
                    value={bearerForm.year}
                    onChange={(e) =>
                      updateBearerField(
                        'year',
                        e.target.value
                      )
                    }
                    placeholder="III Year"
                  />

                </label>


                <label>
                  Class

                  <input
                    value={bearerForm.className}
                    onChange={(e) =>
                      updateBearerField(
                        'className',
                        e.target.value
                      )
                    }
                    placeholder="CSE B"
                  />

                </label>


                <label>
                  Photo URL

                  <input
                    type="url"
                    value={bearerForm.photoUrl}
                    onChange={(e) =>
                      updateBearerField(
                        'photoUrl',
                        e.target.value
                      )
                    }
                    placeholder="https://..."
                  />

                </label>


                <label>
                  Bio

                  <textarea
                    value={bearerForm.bio}
                    onChange={(e) =>
                      updateBearerField(
                        'bio',
                        e.target.value
                      )
                    }
                    placeholder="Short profile"
                  />

                </label>


                <button
                  className="primary"
                  onClick={() =>
                    editingBearer
                      ? updateBearer(
                        editingBearer
                      )
                      : addBearer()
                  }
                >
                  {editingBearer
                    ? 'Update Bearer'
                    : 'Add Bearer'}
                </button>


                <button
                  onClick={() => {

                    setShowBearerForm(false);
                    setEditingBearer(null);

                    setBearerForm({
                      roleId: '',
                      roleName: '',
                      name: '',
                      year: '',
                      className: '',
                      photoUrl: '',
                      bio: ''
                    });

                  }}
                >
                  Cancel
                </button>

              </div>

            )}


          {!showBearerForm &&
            !editingBearer && (

              <button
                className="primary"
                onClick={() =>
                  setShowBearerForm(true)
                }
              >
                + Add Office Bearer
              </button>

            )}

        </div>


        {/* =================================================
            COORDINATORS
        ================================================= */}

        <div className="card">

          <h3>
            Coordinators
          </h3>


          {data.coordinators.length === 0 && (
            <p>
              No coordinators assigned.
            </p>
          )}


          {data.coordinators.map(
            (coordinator) => (

              <div
                key={coordinator._id}
                className="manage-row"
              >

                <div>

                  <strong>
                    {coordinator.name}
                  </strong>

                  <small>
                    {coordinator.email}
                  </small>

                </div>


                <button
                  className="danger"
                  onClick={() =>
                    removeCoordinator(
                      coordinator._id
                    )
                  }
                >
                  Remove
                </button>

              </div>

            )
          )}


          {!showCoordinatorForm && (

            <button
              className="primary"
              onClick={() =>
                setShowCoordinatorForm(true)
              }
            >
              + Add Coordinator
            </button>

          )}


          {showCoordinatorForm && (

            <div className="coordinator-form">

              <h4>
                Add Coordinator
              </h4>


              <select
                value={selectedCoordinator}
                onChange={(e) =>
                  setSelectedCoordinator(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select Coordinator
                </option>

                {allCoordinators
                  .filter(
                    (person) =>
                      !data.coordinators.some(
                        (existing) =>
                          String(
                            existing._id
                          ) ===
                          String(
                            person._id
                          )
                      )
                  )
                  .map((person) => (

                    <option
                      key={person._id}
                      value={person._id}
                    >
                      {person.name}
                      {' - '}
                      {person.email}
                    </option>

                  ))}

              </select>


              <button
                className="primary"
                onClick={addCoordinator}
              >
                Add Coordinator
              </button>


              <button
                onClick={() => {
                  setShowCoordinatorForm(
                    false
                  );
                  setSelectedCoordinator('');
                }}
              >
                Cancel
              </button>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}
/* =========================================================
   MY REGISTRATIONS
========================================================= */

function My() {
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    get('/my-registrations')
      .then(setRegistrations)
      .catch(() => { });
  }, []);

  return (
    <>
      <h2>My Registrations</h2>

      {registrations.length === 0 ? (
        <div className="card">
          <p>You have not registered for any event yet.</p>
        </div>
      ) : (
        <div className="grid">

          {registrations.map((r) => {

            const event = r.eventId;

            return (
              <div
                className="card registration-card"
                key={r._id}
              >

                <h3>
                  {event?.name}
                </h3>

                <p>
                  <b>Community:</b>{' '}
                  {event?.communityId?.name}
                </p>

                <hr />

                {r.registrationType === 'team' ? (
                  <>
                    <p>
                      <b>Team Name:</b>{' '}
                      {r.teamName || 'Unnamed Team'}
                    </p>

                    <p>
                      <b>Team Members:</b>
                    </p>

                    <div className="team-members">
                      {r.members?.map((member, index) => (
                        <div
                          className="team-member"
                          key={index}
                        >
                          {index + 1}. {member.name}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p>
                    <b>Registration:</b> Individual
                  </p>
                )}

                <hr />

                <p>
                  <b>Date:</b>{' '}
                  {event?.date}
                </p>

                <p>
                  <b>Time:</b>{' '}
                  {event?.time}
                </p>

                <p>
                  <b>Venue:</b>{' '}
                  {event?.venue}
                </p>

                <p>
                  <b>Coordinator:</b>{' '}
                  {event?.studentCoordinator ||
                    event?.facultyCoordinator ||
                    'Not specified'}
                </p>

              </div>
            );
          })}

        </div>
      )}
    </>
  );
}

/* =========================================================
   MY PROFILE
========================================================= */

function Profile({
  user,
  setUser,
  setMsg
}) {
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    registerNo: user.registerNo || '',
    className: user.className || '',
    department: user.department || '',
    year: user.year || '',
    gender: user.gender || ''
  });

  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const updateField = (key, value) => {
    setForm((old) => ({
      ...old,
      [key]: value
    }));
  };

  /* PROFILE PHOTO CHANGE */
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Allow only image files
    if (!file.type.startsWith('image/')) {
      setMsg('Please select a valid image file.');
      return;
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setMsg('Profile picture must be less than 5 MB.');
      return;
    }

    setPhoto(file);
  };

  /* SAVE PROFILE */
  const saveProfile = async () => {
    try {
      setSaving(true);

      /*
        Backend endpoint:
        PUT /auth/profile

        Using FormData because
        profile picture is uploaded as a file.
      */

      const formData = new FormData();

      formData.append(
        'name',
        form.name
      );

      formData.append(
        'email',
        form.email
      );

      formData.append(
        'registerNo',
        form.registerNo
      );

      formData.append(
        'className',
        form.className
      );

      formData.append(
        'department',
        form.department
      );

      formData.append(
        'year',
        form.year
      );

      formData.append(
        'gender',
        form.gender
      );

      // Add photo only if user selected a new one
      if (photo) {
        formData.append(
          'photo',
          photo
        );
      }

      const response = await send(
        '/auth/profile',
        formData,
        'PUT'
      );

      /*
        Backend returns:

        {
          user: updatedUser
        }
      */

      const newUser = response.user;

      localStorage.setItem(
        'user',
        JSON.stringify(newUser)
      );

      setUser(newUser);

      // Clear selected file after successful save
      setPhoto(null);

      setMsg(
        'Profile updated successfully.'
      );

    } catch (error) {
      setMsg(error.message);
    } finally {
      setSaving(false);
    }
  };

  /* PHOTO PREVIEW */

  const photoPreview = photo
    ? URL.createObjectURL(photo)
    : user.photoUrl
      ? `http://localhost:5000${user.photoUrl}`
      : '';

  return (
    <>
      <h2>My Profile</h2>

      <div className="card profile-card">

        {/* ============================= */}
        {/* PROFILE PHOTO */}
        {/* ============================= */}

        <div className="profile-photo-section">

          {photoPreview ? (

            <img
              src={photoPreview}
              alt="Profile"
              className="profile-photo"
            />

          ) : (

            <div className="profile-avatar">

              {form.name
                ? form.name
                  .charAt(0)
                  .toUpperCase()
                : 'U'}

            </div>

          )}

          <p>
            Profile Picture
          </p>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handlePhotoChange}
          />

          <small>
            JPG, PNG or WEBP • Maximum 5 MB
          </small>

        </div>


        {/* ============================= */}
        {/* PROFILE FORM */}
        {/* ============================= */}

        <div className="form">

          {/* FULL NAME */}

          <label>
            Full Name

            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                updateField(
                  'name',
                  e.target.value
                )
              }
            />
          </label>


          {/* EMAIL */}

          <label>
            Email

            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                updateField(
                  'email',
                  e.target.value
                )
              }
            />
          </label>


          {/* REGISTER NUMBER */}

          <label>
            Register Number

            <input
              type="text"
              value={form.registerNo}
              onChange={(e) =>
                updateField(
                  'registerNo',
                  e.target.value
                )
              }
            />
          </label>


          {/* CLASS */}

          <label>
            Class

            <input
              type="text"
              value={form.className}
              onChange={(e) =>
                updateField(
                  'className',
                  e.target.value
                )
              }
              placeholder="Example: CSE A"
            />
          </label>


          {/* DEPARTMENT */}

          <label>
            Department

            <input
              type="text"
              value={form.department}
              onChange={(e) =>
                updateField(
                  'department',
                  e.target.value
                )
              }
              placeholder="Example: CSE"
            />
          </label>


          {/* YEAR */}

          <label>
            Year

            <select
              value={form.year}
              onChange={(e) =>
                updateField(
                  'year',
                  e.target.value
                )
              }
            >

              <option value="">
                Select Year
              </option>

              <option value="I Year">
                I Year
              </option>

              <option value="II Year">
                II Year
              </option>

              <option value="III Year">
                III Year
              </option>

              <option value="IV Year">
                IV Year
              </option>

            </select>

          </label>


          {/* GENDER */}

          <label>
            Gender

            <select
              value={form.gender}
              onChange={(e) =>
                updateField(
                  'gender',
                  e.target.value
                )
              }
            >

              <option value="">
                Select Gender
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </label>


          {/* ROLE */}

          <label>
            Role

            <input
              type="text"
              value={user.role}
              disabled
            />
          </label>


          {/* SAVE BUTTON */}

          <button
            className="primary"
            onClick={saveProfile}
            disabled={saving}
          >

            {saving
              ? 'Saving...'
              : 'Save Profile'}

          </button>

        </div>

      </div>
    </>
  );
}

function Notifications({
  notifications,
  setNotifications
}) {

  const markRead = async (id) => {

    try {

      await send(
        `/notifications/${id}/read`,
        {},
        'PATCH'
      );

      setNotifications(
        notifications.map((n) =>
          n._id === id
            ? { ...n, read: true }
            : n
        )
      );

    } catch (e) { }
  };


  const markAllRead = async () => {

    try {

      await send(
        '/notifications/read-all',
        {},
        'PATCH'
      );

      setNotifications(
        notifications.map((n) => ({
          ...n,
          read: true
        }))
      );

    } catch (e) { }
  };


  return (
    <>
      <div className="title">
        <h2>Notifications</h2>

        {notifications.some(
          (n) => !n.read
        ) && (
            <button onClick={markAllRead}>
              Mark all as read
            </button>
          )}
      </div>


      {notifications.length === 0 ? (

        <div className="card">
          <p>
            No notifications yet.
          </p>
        </div>

      ) : (

        <div className="notification-list">

          {notifications.map((n) => (

            <div
              key={n._id}
              className={
                `card notification-item ${n.read ? 'read' : 'unread'
                }`
              }
              onClick={() => {
                if (!n.read) {
                  markRead(n._id);
                }
              }}
            >

              <h3>
                🔔 {n.title}
              </h3>

              <p>
                {n.message}
              </p>

              {n.eventId && (
                <small>
                  {n.eventId.name}
                </small>
              )}

              <small>
                {new Date(
                  n.createdAt
                ).toLocaleString()}
              </small>

            </div>

          ))}

        </div>

      )}
    </>
  );
}

/* =========================================================
   STAFF ELECTION MANAGEMENT
========================================================= */

/* =========================================================
   STAFF ELECTION MANAGEMENT
========================================================= */

function ElectionManagement({
  cs,
  setMsg,
  reloadElections
}) {

  const [title, setTitle] = useState('');

  const [communityId, setCommunityId] = useState(
    cs[0]?._id || ''
  );

  const [roles, setRoles] = useState([]);

  const [users, setUsers] = useState([]);

  const [positions, setPositions] = useState([
    {
      roleId: '',
      name: '',
      candidates: [
        {
          userId: '',
          name: '',
          email: '',
          registerNo: '',
          photo: ''
        }
      ]
    }
  ]);

  const [loading, setLoading] = useState(false);


  /* =====================================================
     LOAD ROLES
  ===================================================== */

  const loadElectionData = async (selectedCommunityId) => {

    if (!selectedCommunityId) {
      setRoles([]);
      return;
    }

    try {

      const communityData = await get(
        `/communities/${selectedCommunityId}`
      );

      setRoles(
        communityData.roles || []
      );

    } catch (error) {

      setMsg(error.message);

    }
  };


  /* =====================================================
     LOAD USERS FOR CANDIDATES
  ===================================================== */

  const loadUsers = async () => {

    try {

      const data = await get(
        '/communities/users/coordinators'
      );

      setUsers(data || []);

    } catch (error) {

      setMsg(error.message);

    }
  };


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    if (!communityId) return;

    loadElectionData(communityId);

    loadUsers();

  }, [communityId]);


  /* =====================================================
     ADD POSITION
  ===================================================== */

  const addPosition = () => {

    setPositions([
      ...positions,

      {
        roleId: '',
        name: '',
        candidates: [
          {
            userId: '',
            name: '',
            email: '',
            registerNo: '',
            photo: ''
          }
        ]
      }
    ]);

  };


  /* =====================================================
     REMOVE POSITION
  ===================================================== */

  const removePosition = (positionIndex) => {

    if (positions.length === 1) {

      setMsg(
        'At least one position is required.'
      );

      return;
    }

    setPositions(
      positions.filter(
        (_, index) =>
          index !== positionIndex
      )
    );

  };


  /* =====================================================
     SELECT ROLE
  ===================================================== */

  const selectRole = (
    positionIndex,
    roleId
  ) => {

    const selectedRole = roles.find(
      role => role._id === roleId
    );

    setPositions(
      positions.map(
        (position, index) => {

          if (index !== positionIndex) {
            return position;
          }

          return {
            ...position,
            roleId,
            name: selectedRole
              ? selectedRole.name
              : ''
          };

        }
      )
    );

  };


  /* =====================================================
     ADD CANDIDATE
  ===================================================== */

  const addCandidate = (
    positionIndex
  ) => {

    setPositions(
      positions.map(
        (position, index) => {

          if (index !== positionIndex) {
            return position;
          }

          return {
            ...position,

            candidates: [
              ...position.candidates,

              {
                userId: '',
                name: '',
                email: '',
                registerNo: '',
                photo: ''
              }
            ]
          };

        }
      )
    );

  };


  /* =====================================================
     REMOVE CANDIDATE
  ===================================================== */

  const removeCandidate = (
    positionIndex,
    candidateIndex
  ) => {

    const position =
      positions[positionIndex];

    if (
      position.candidates.length === 1
    ) {

      setMsg(
        'At least one candidate is required.'
      );

      return;
    }

    setPositions(
      positions.map(
        (position, index) => {

          if (index !== positionIndex) {
            return position;
          }

          return {
            ...position,

            candidates:
              position.candidates.filter(
                (_, cIndex) =>
                  cIndex !== candidateIndex
              )
          };

        }
      )
    );

  };


  /* =====================================================
     SELECT CANDIDATE
  ===================================================== */

  const selectCandidate = (
    positionIndex,
    candidateIndex,
    userId
  ) => {

    const selectedUser =
      users.find(
        user =>
          user._id === userId
      );

    if (!selectedUser) {
      return;
    }

    setPositions(
      positions.map(
        (position, pIndex) => {

          if (
            pIndex !== positionIndex
          ) {
            return position;
          }

          return {
            ...position,

            candidates:
              position.candidates.map(
                (candidate, cIndex) => {

                  if (
                    cIndex !== candidateIndex
                  ) {
                    return candidate;
                  }

                  return {
                    userId:
                      selectedUser._id,

                    name:
                      selectedUser.name,

                    email:
                      selectedUser.email,

                    registerNo:
                      selectedUser.registerNo || '',

                    photo:
                      selectedUser.photoUrl || ''
                  };

                }
              )
          };

        }
      )
    );

  };


  /* =====================================================
     CREATE ELECTION
  ===================================================== */

  const createElection = async () => {

    if (!title.trim()) {

      setMsg(
        'Please enter election title.'
      );

      return;
    }

    if (!communityId) {

      setMsg(
        'Please select a community.'
      );

      return;
    }

    if (positions.length === 0) {

      setMsg(
        'Please add at least one position.'
      );

      return;
    }


    /* VALIDATION */

    for (const position of positions) {

      if (!position.roleId) {

        setMsg(
          'Please select a role for every position.'
        );

        return;
      }

      if (
        position.candidates.length === 0
      ) {

        setMsg(
          `Add at least one candidate for ${position.name}.`
        );

        return;
      }


      for (
        const candidate
        of position.candidates
      ) {

        if (!candidate.userId) {

          setMsg(
            `Please select a candidate for ${position.name}.`
          );

          return;
        }

      }

    }


    setLoading(true);

    try {

      const result = await send(
        '/elections',
        {
          title: title.trim(),

          communityId,

          positions,

          status: 'active'
        }
      );

      console.log(
        'Election created:',
        result
      );

      setMsg(
        'Election created successfully.'
      );


      /* RESET */

      setTitle('');

      setCommunityId(
        cs[0]?._id || ''
      );

      setPositions([
        {
          roleId: '',
          name: '',
          candidates: [
            {
              userId: '',
              name: '',
              email: '',
              registerNo: '',
              photo: ''
            }
          ]
        }
      ]);


      if (reloadElections) {
        reloadElections();
      }

    } catch (error) {

      console.error(
        'CREATE ELECTION ERROR:',
        error
      );

      setMsg(
        error.message
      );

    } finally {

      setLoading(false);

    }

  };


  /* =====================================================
     UI
  ===================================================== */

  return (

    <div className="page">

      <h2>
        🗳️ Election Management
      </h2>

      <p>
        Create an election and select
        roles and candidates.
      </p>


      {/* =================================================
          ELECTION DETAILS
      ================================================= */}

      <div className="card">

        <h3>
          Election Details
        </h3>


        <label>

          Election Title

          <input
            type="text"
            placeholder="Example: IEI Election 2026"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />

        </label>


        <label>

          Community

          <select
            value={communityId}
            onChange={(e) => {

              const value =
                e.target.value;

              setCommunityId(value);

              setPositions([
                {
                  roleId: '',
                  name: '',
                  candidates: [
                    {
                      userId: '',
                      name: '',
                      email: '',
                      registerNo: '',
                      photo: ''
                    }
                  ]
                }
              ]);

            }}
          >

            <option value="">
              Select Community
            </option>

            {cs.map(
              community => (

                <option
                  key={community._id}
                  value={community._id}
                >
                  {community.name}
                </option>

              )
            )}

          </select>

        </label>

      </div>


      {/* =================================================
          POSITIONS
      ================================================= */}

      <h3>
        Election Positions
      </h3>


      {positions.map(
        (position, positionIndex) => (

          <div
            className="card"
            key={positionIndex}
            style={{
              marginBottom: '20px'
            }}
          >


            {/* POSITION HEADER */}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center'
              }}
            >

              <h3>
                Position {positionIndex + 1}
              </h3>


              <button
                onClick={() =>
                  removePosition(
                    positionIndex
                  )
                }
              >
                Remove Position
              </button>

            </div>


            {/* ROLE DROPDOWN */}

            <label>

              Select Role

              <select
                value={
                  position.roleId
                }
                onChange={(e) =>
                  selectRole(
                    positionIndex,
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select Office Bearer Role
                </option>

                {roles.map(
                  role => (

                    <option
                      key={role._id}
                      value={role._id}
                    >
                      {role.name}
                    </option>

                  )
                )}

              </select>

            </label>


            {/* SELECTED ROLE */}

            {position.name && (

              <p
                style={{
                  marginTop: '8px',
                  fontWeight: '600'
                }}
              >
                Selected Position:
                {' '}
                {position.name}
              </p>

            )}


            {/* CANDIDATES */}

            <h4>
              Candidates
            </h4>


            {position.candidates.map(
              (
                candidate,
                candidateIndex
              ) => (

                <div
                  key={candidateIndex}
                  style={{
                    border:
                      '1px solid #ddd',
                    padding: '15px',
                    marginBottom:
                      '10px',
                    borderRadius:
                      '8px'
                  }}
                >

                  <strong>
                    Candidate {candidateIndex + 1}
                  </strong>


                  {/* CANDIDATE DROPDOWN */}

                  <select
                    value={
                      candidate.userId
                    }
                    onChange={(e) =>
                      selectCandidate(
                        positionIndex,
                        candidateIndex,
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Select Candidate
                    </option>


                    {users.map(
                      user => (

                        <option
                          key={user._id}
                          value={user._id}
                        >

                          {user.name}
                          {' — '}
                          {user.email}

                        </option>

                      )
                    )}

                  </select>


                  {/* SELECTED USER DETAILS */}

                  {candidate.userId && (

                    <div
                      style={{
                        marginTop: '10px',
                        padding: '10px',
                        background:
                          '#f5f7fa',
                        borderRadius:
                          '6px'
                      }}
                    >

                      <div>
                        <strong>
                          Name:
                        </strong>
                        {' '}
                        {candidate.name}
                      </div>

                      <div>
                        <strong>
                          Email:
                        </strong>
                        {' '}
                        {candidate.email}
                      </div>

                      <div>
                        <strong>
                          Register No:
                        </strong>
                        {' '}
                        {candidate.registerNo ||
                          'Not available'}
                      </div>

                    </div>

                  )}


                  <button
                    onClick={() =>
                      removeCandidate(
                        positionIndex,
                        candidateIndex
                      )
                    }
                    style={{
                      marginTop: '10px'
                    }}
                  >
                    Remove Candidate
                  </button>

                </div>

              )
            )}


            <button
              onClick={() =>
                addCandidate(
                  positionIndex
                )
              }
            >
              + Add Candidate
            </button>

          </div>

        )
      )}


      {/* =================================================
          ADD POSITION
      ================================================= */}

      <button
        onClick={addPosition}
        style={{
          marginBottom: '20px'
        }}
      >
        + Add Position
      </button>


      <br />


      {/* =================================================
          CREATE
      ================================================= */}

      <button
        className="primary"
        onClick={createElection}
        disabled={loading}
      >

        {loading
          ? 'Creating Election...'
          : '🗳️ Create Election'}

      </button>

    </div>

  );

}
/* =========================================================
   STUDENT FEEDBACK / ENQUIRY
========================================================= */

function EnquiryPage({ setMsg }) {

  const [form, setForm] = useState({
    type: 'Enquiry',
    subject: '',
    message: ''
  });

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);


  const load = async () => {

    try {

      const data = await get('/enquiries/mine');

      setItems(data);

    } catch (error) {

      setMsg(error.message);

    }

  };


  useEffect(() => {

    load();

  }, []);


  const submit = async () => {

    if (
      !form.subject.trim() ||
      !form.message.trim()
    ) {
      setMsg('Please enter subject and message.');
      return;
    }

    try {

      setLoading(true);

      await send('/enquiries', form);

      setMsg(
        'Your feedback / enquiry has been submitted successfully.'
      );

      setForm({
        type: 'Enquiry',
        subject: '',
        message: ''
      });

      await load();

    } catch (error) {

      setMsg(error.message);

    } finally {

      setLoading(false);

    }

  };


  return (
    <>
      <div className="title">
        <div>
          <h2>Feedback / Enquiry</h2>

          <p>
            Submit your feedback, enquiry, complaint or suggestion.
          </p>
        </div>
      </div>


      <div className="card">

        <h3>Submit New</h3>

        <div className="form">

          <label>
            Type

            <select
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value
                })
              }
            >
              <option value="Feedback">
                Feedback
              </option>

              <option value="Enquiry">
                Enquiry
              </option>

              <option value="Complaint">
                Complaint
              </option>

              <option value="Suggestion">
                Suggestion
              </option>
            </select>
          </label>


          <label>
            Subject

            <input
              type="text"
              value={form.subject}
              placeholder="Enter subject"
              onChange={(e) =>
                setForm({
                  ...form,
                  subject: e.target.value
                })
              }
            />
          </label>


          <label>
            Message

            <textarea
              rows="6"
              value={form.message}
              placeholder="Write your feedback or enquiry..."
              onChange={(e) =>
                setForm({
                  ...form,
                  message: e.target.value
                })
              }
            />
          </label>


          <button
            className="primary"
            onClick={submit}
            disabled={loading}
          >
            {loading
              ? 'Submitting...'
              : 'Submit'}
          </button>

        </div>

      </div>


      <h2>My Submissions</h2>

      <div className="grid">

        {items.length === 0 ? (

          <div className="card">
            <p>
              No feedback or enquiries submitted yet.
            </p>
          </div>

        ) : (

          items.map((item) => (

            <div
              className="card"
              key={item._id}
            >

              <span className="status">
                {item.status}
              </span>

              <h3>
                {item.subject}
              </h3>

              <p>
                <b>Type:</b> {item.type}
              </p>

              <p>
                {item.message}
              </p>

              {item.assignedTo && (
                <p>
                  <b>Assigned To:</b>{' '}
                  {item.assignedTo.name}
                </p>
              )}

              {item.coordinatorReply && (
                <div className="card">
                  <b>Coordinator Reply:</b>

                  <p>
                    {item.coordinatorReply}
                  </p>
                </div>
              )}

              <small>
                {new Date(
                  item.createdAt
                ).toLocaleString()}
              </small>

            </div>

          ))

        )}

      </div>
    </>
  );
}

/* =========================================================
   STAFF FEEDBACK / ENQUIRY
========================================================= */

function StaffEnquiryPage({ setMsg }) {

  const [items, setItems] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const [enquiries, coordinatorList] = await Promise.all([
        get('/enquiries'),
        get('/enquiries/coordinators')
      ]);

      setItems(enquiries);
      setCoordinators(coordinatorList);

    } catch (error) {
      setMsg(error.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const assignEnquiry = async (id, coordinatorId) => {

    if (!coordinatorId) {
      setMsg('Please select a coordinator.');
      return;
    }

    try {

      setLoading(true);

      await send(
        `/enquiries/${id}/assign`,
        { coordinatorId },
        'PATCH'
      );

      setMsg('Enquiry assigned successfully.');

      await load();

    } catch (error) {
      setMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="title">
        <div>
          <h2>Feedback / Enquiries</h2>

          <p>
            Review student feedback, enquiries, complaints and suggestions.
          </p>
        </div>
      </div>

      {items.length === 0 ? (

        <div className="card">
          <h3>No Enquiries</h3>
          <p>
            No feedback or enquiries have been submitted by students yet.
          </p>
        </div>

      ) : (

        <div className="grid">

          {items.map((item) => (

            <div className="card" key={item._id}>

              <span className="status">
                {item.status}
              </span>

              <h3>{item.subject}</h3>

              <p>
                <b>Type:</b> {item.type}
              </p>

              <p>
                <b>Student:</b>{' '}
                {item.userId?.name || 'Unknown'}
              </p>

              <p>
                <b>Email:</b>{' '}
                {item.userId?.email || 'N/A'}
              </p>

              <p>
                <b>Register No:</b>{' '}
                {item.userId?.registerNo || 'N/A'}
              </p>

              <p>
                <b>Message:</b>
              </p>

              <p>
                {item.message}
              </p>

              {item.assignedTo && (
                <p>
                  <b>Assigned To:</b>{' '}
                  {item.assignedTo.name}
                </p>
              )}

              {item.coordinatorReply && (
                <div className="card">

                  <b>Coordinator Reply:</b>

                  <p>
                    {item.coordinatorReply}
                  </p>

                </div>
              )}

              {item.status !== 'Resolved' && (

                <div className="form">

                  <label>
                    Assign to Coordinator

                    <select
                      defaultValue={
                        item.assignedTo?._id || ''
                      }
                      id={`coordinator-${item._id}`}
                    >

                      <option value="">
                        Select Coordinator
                      </option>

                      {coordinators.map((coordinator) => (

                        <option
                          key={coordinator._id}
                          value={coordinator._id}
                        >
                          {coordinator.name}
                        </option>

                      ))}

                    </select>

                  </label>

                  <button
                    className="primary"
                    disabled={loading}
                    onClick={() => {

                      const select =
                        document.getElementById(
                          `coordinator-${item._id}`
                        );

                      assignEnquiry(
                        item._id,
                        select.value
                      );

                    }}
                  >
                    {loading
                      ? 'Assigning...'
                      : 'Assign to Coordinator'}
                  </button>

                </div>

              )}

              <small>
                {new Date(
                  item.createdAt
                ).toLocaleString()}
              </small>

            </div>

          ))}

        </div>

      )}

    </>
  );
}

/* =========================================================
   COORDINATOR ASSIGNED ENQUIRIES
========================================================= */

function CoordinatorEnquiryPage({ setMsg }) {

  const [items, setItems] = useState([]);
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const data = await get('/enquiries/assigned');
      setItems(data);
    } catch (error) {
      setMsg(error.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateReply = (id, value) => {
    setReplies(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const resolveEnquiry = async (id) => {

    const reply = replies[id]?.trim();

    if (!reply) {
      setMsg('Please enter a reply.');
      return;
    }

    try {

      setLoading(true);

      await send(
        `/enquiries/${id}/resolve`,
        { reply },
        'PATCH'
      );

      setMsg('Enquiry resolved and reply sent.');

      await load();

    } catch (error) {
      setMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="title">
        <div>
          <h2>💬 Assigned Enquiries</h2>

          <p>
            View and respond to enquiries assigned to you.
          </p>
        </div>
      </div>

      {items.length === 0 ? (

        <div className="card">
          <h3>No Assigned Enquiries</h3>

          <p>
            There are no enquiries assigned to you.
          </p>
        </div>

      ) : (

        <div className="grid">

          {items.map((item) => (

            <div
              className="card"
              key={item._id}
            >

              <span className="status">
                {item.status}
              </span>

              <h3>
                {item.subject}
              </h3>

              <p>
                <b>Type:</b> {item.type}
              </p>

              <p>
                <b>Student:</b>{' '}
                {item.userId?.name || 'Unknown'}
              </p>

              <p>
                <b>Register No:</b>{' '}
                {item.userId?.registerNo || 'N/A'}
              </p>

              <p>
                <b>Email:</b>{' '}
                {item.userId?.email || 'N/A'}
              </p>

              <p>
                <b>Message:</b>
              </p>

              <p>
                {item.message}
              </p>

              {item.status === 'Resolved' ? (

                <div className="card">

                  <b>Your Reply:</b>

                  <p>
                    {item.coordinatorReply}
                  </p>

                  <small>
                    This enquiry has already been resolved.
                  </small>

                </div>

              ) : (

                <div className="form">

                  <label>
                    Reply to Student

                    <textarea
                      rows="5"
                      placeholder="Enter your reply..."
                      value={replies[item._id] || ''}
                      onChange={(e) =>
                        updateReply(
                          item._id,
                          e.target.value
                        )
                      }
                    />

                  </label>

                  <button
                    className="primary"
                    disabled={loading}
                    onClick={() =>
                      resolveEnquiry(item._id)
                    }
                  >
                    {loading
                      ? 'Sending...'
                      : 'Resolve & Reply'}
                  </button>

                </div>

              )}

              <small>
                {new Date(
                  item.createdAt
                ).toLocaleString()}
              </small>

            </div>

          ))}

        </div>

      )}

    </>
  );
}
/* =========================================================
   START REACT
========================================================= */

createRoot(
  document.getElementById('root')
).render(
  <App />
);