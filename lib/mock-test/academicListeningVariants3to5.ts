import type { CompactListeningVariant } from "./listeningVariantBuilder";

export const LISTENING_VARIANTS_3_TO_5: CompactListeningVariant[] = [
  {
    mockNumber: 3,
    introTexts: [
      "Section 1 of 4 — Listening. You will hear a student enrolling on a university course. Look at Questions 1 to 5.",
      "Section 2 of 4 — Listening. You will hear a talk about a learning support centre. Look at Questions 11 to 15.",
      "Section 3 of 4 — Listening. You will hear students planning a group presentation. Look at Questions 21 to 25.",
      "Section 4 of 4 — Listening. You will hear a lecture on educational psychology. Look at Questions 31 to 40.",
    ],
    blocks: [
      {
        questionStart: 1, questionEnd: 5,
        formTitle: "University Enrolment Form",
        prepMessage: "You have 30 seconds to look at Questions 1 to 5.",
        transcript: `Admissions: Bristol University enrolment office, how may I help?
Student: I'd like to register for the Master's in Educational Technology starting September.
Admissions: Can I take your first name?
Student: Sophie.
Admissions: And your surname?
Student: Clarke — that's C-L-A-R-K-E.
Admissions: Contact number?
Student: Oh seven seven, zero zero, nine zero zero, four five six.
Admissions: Tuition deposit is two thousand five hundred pounds.
Student: Two thousand five hundred?
Admissions: Sorry — actually two thousand pounds for early applicants. I had the standard deposit open.
Student: Two thousand — I'll pay by bank transfer.
Admissions: Email for your student portal?
Student: sophie dot clarke at bristol dot ac dot uk.`,
        voice: "nova",
      },
      {
        questionStart: 6, questionEnd: 10,
        breakMessage: "You now have 30 seconds to look at Questions 6 to 10.",
        transcript: `Admissions: Will you need on-campus housing?
Student: Yes, a single room please.
Admissions: Halls open from the twenty-eighth of August. Meal plan is optional at eight hundred pounds per semester.
Student: I'd like the meal plan. Any disability support?
Admissions: Contact the access office before the fifteenth of August.
Student: When is orientation week?
Admissions: The first week of September, starting Monday at nine AM in the main hall.`,
        voice: "nova",
      },
      {
        questionStart: 11, questionEnd: 15,
        prepMessage: "You have 30 seconds to look at Questions 11 to 15.",
        transcript: `Welcome to the Academic Skills Centre. We're open weekdays eight AM to six PM.
One-to-one writing coaching is free for all enrolled students; book online twenty-four hours ahead.
Workshops on referencing run every Tuesday at two PM in Room 12.
The digital literacy suite on the second floor has thirty workstations.
Evening drop-in sessions for maths support are Thursdays until eight PM.`,
        voice: "fable",
      },
      {
        questionStart: 16, questionEnd: 20,
        breakMessage: "You now have 30 seconds to look at Questions 16 to 20.",
        transcript: `Match each facility to its location.
The peer mentoring desk is beside the main entrance.
The quiet study pods are on the third floor, east corridor.
Printing services are in the basement, next to the IT help desk.
The presentation practice room is in the west wing, room W3.
The café is on the ground floor, facing the courtyard.`,
        voice: "fable",
      },
      {
        questionStart: 21, questionEnd: 25,
        prepMessage: "You have 30 seconds to look at Questions 21 to 25.",
        transcript: `Tutor: How will you divide the group presentation on blended learning?
Omar: I'll research platform adoption statistics.
Lina: I'll interview two lecturers about hybrid classrooms.
Tutor: Deadline?
Omar: Slides due on the ninth of November — wait, no.
Lina: The brief says the twelfth.
Omar: Oh — sorry, actually the twelfth of November. I mixed it up with the rehearsal date.
Lina: We'll rehearse in the practice room on the eighth.
Tutor: Include a critical evaluation of student engagement data.`,
        voice: "onyx",
      },
      {
        questionStart: 26, questionEnd: 30,
        breakMessage: "You have 30 seconds to look at Questions 26 to 30.",
        transcript: `Tutor: Match each task to the correct team member or resource.
Omar: Statistics section uses the national survey report.
Lina: Interview quotes come from the education faculty.
Omar: Graphs will be designed in the digital literacy suite.
Lina: Rehearsal is booked for room W3.
Omar: References must follow APA seventh edition.`,
        voice: "alloy",
      },
      {
        questionStart: 31, questionEnd: 40,
        prepMessage: "You have 30 seconds to look at Questions 31 to 40.",
        transcript: `This lecture covers educational psychology. Constructivism emphasises learners building knowledge through experience.
Formative assessment provides feedback during learning rather than only at the end. Metacognition is awareness of one's own thinking strategies.
Scaffolding means temporary support that is gradually removed as competence grows. Differentiated instruction adapts tasks to diverse learner needs.
Motivation theories distinguish intrinsic interest from external rewards. Digital tools can personalise practice but require teacher mediation.`,
        voice: "shimmer",
      },
    ],
    questions: [
      [1, "form", "First name:", "Sophie"],
      [2, "form", "Surname:", "Clarke"],
      [3, "form", "Programme start:", "September"],
      [4, "form", "Phone:", "07700900456"],
      [5, "form", "Deposit:", "2000"],
      [6, "note", "Housing:", "single room"],
      [7, "note", "Halls open:", "28 August"],
      [8, "note", "Meal plan cost:", "800"],
      [9, "note", "Access office deadline:", "15 August"],
      [10, "note", "Orientation:", "first week of September"],
      [11, "mcq", "Centre hours:", "8 AM to 6 PM", ["7 AM to 5 PM", "8 AM to 6 PM", "9 AM to 7 PM"]],
      [12, "mcq", "Writing coaching:", "Free", ["10", "25", "Free"]],
      [13, "mcq", "Referencing workshops:", "Tuesday 2 PM", ["Monday 2 PM", "Tuesday 2 PM", "Wednesday 2 PM"]],
      [14, "mcq", "Digital literacy floor:", "Second floor", ["First floor", "Second floor", "Third floor"]],
      [15, "mcq", "Maths drop-in day:", "Thursday", ["Tuesday", "Wednesday", "Thursday"]],
      [16, "matching", "Peer mentoring:", "main entrance"],
      [17, "matching", "Study pods:", "third floor east"],
      [18, "matching", "Printing:", "basement"],
      [19, "matching", "Practice room:", "west wing W3"],
      [20, "matching", "Café:", "ground floor courtyard"],
      [21, "mcq", "Omar's section:", "Platform statistics", ["Interview quotes", "Platform statistics", "APA guide", "Café menu"]],
      [22, "mcq", "Lina's section:", "Lecturer interviews", ["National survey", "Lecturer interviews", "IT support", "Meal plan"]],
      [23, "mcq", "Slides deadline:", "12 November", ["9 November", "12 November", "15 November"]],
      [24, "mcq", "Rehearsal date:", "8 November", ["8 October", "8 November", "15 November"]],
      [25, "mcq", "Required analysis:", "Student engagement", ["Café revenue", "Student engagement", "Parking data", "Staff salaries"]],
      [26, "matching-features", "Statistics →", "national survey"],
      [27, "matching-features", "Quotes →", "education faculty"],
      [28, "matching-features", "Graphs →", "digital literacy suite"],
      [29, "matching-features", "Rehearsal →", "room W3"],
      [30, "matching-features", "References →", "APA seventh"],
      [31, "summary", "Learners build knowledge:", "constructivism"],
      [32, "summary", "Feedback during learning:", "formative assessment"],
      [33, "summary", "Awareness of thinking:", "metacognition"],
      [34, "summary", "Temporary support:", "scaffolding"],
      [35, "summary", "Adapting tasks:", "differentiated instruction"],
      [36, "summary", "Internal interest:", "intrinsic"],
      [37, "summary", "Personalised practice tools:", "digital tools"],
      [38, "summary", "Requires teacher mediation:", "digital tools"],
      [39, "summary", "External rewards type:", "extrinsic"],
      [40, "summary", "Knowledge through experience:", "constructivism"],
    ],
  },
  {
    mockNumber: 4,
    introTexts: [
      "Section 1 of 4 — Listening. You will hear a booking for an observatory visit. Look at Questions 1 to 5.",
      "Section 2 of 4 — Listening. You will hear a talk about a space education centre. Look at Questions 11 to 15.",
      "Section 3 of 4 — Listening. You will hear students discussing an astronomy project. Look at Questions 21 to 25.",
      "Section 4 of 4 — Listening. You will hear a lecture on cosmology. Look at Questions 31 to 40.",
    ],
    blocks: [
      {
        questionStart: 1, questionEnd: 5,
        formTitle: "Observatory Visit Booking Form",
        prepMessage: "You have 30 seconds to look at Questions 1 to 5.",
        transcript: `Booking: Greenwich Observatory tours, good evening.
Caller: I'd like two tickets for the stargazing session on the twentieth of December.
Booking: Can I take your first name?
Caller: Daniel.
Booking: And your surname?
Caller: Brooks — that's B-R-O-O-K-S.
Booking: Phone number?
Caller: Oh seven eight, one two three, four five six seven eight.
Booking: Each ticket is thirty-eight pounds, including telescope access.
Caller: Thirty-eight?
Booking: Sorry — actually thirty-two pounds online. The desk price is higher.
Caller: Thirty-two — fine. We'll arrive by train from central London.
Booking: Email for the confirmation?
Caller: daniel dot brooks at outlook dot com.`,
        voice: "onyx",
      },
      {
        questionStart: 6, questionEnd: 10,
        breakMessage: "You now have 30 seconds to look at Questions 6 to 10.",
        transcript: `Booking: Sessions begin at seven thirty PM after sunset.
Caller: Is there a minimum age?
Booking: Children under ten must be accompanied by an adult.
Caller: What should we bring?
Booking: Warm clothing is essential; temperatures drop below ten degrees.
Caller: Is photography allowed?
Booking: Yes, but flash photography is prohibited near the telescopes.
Caller: Where do we check in?
Booking: At the visitor pavilion, five hundred metres before the dome.`,
        voice: "onyx",
      },
      {
        questionStart: 11, questionEnd: 15,
        prepMessage: "You have 30 seconds to look at Questions 11 to 15.",
        transcript: `Welcome to the National Space Education Centre. Open daily ten AM to eight PM except Fridays until noon only.
General admission is fifty-five riyals; school groups pay thirty riyals per student.
The Mars rover simulator is on level two and runs every forty-five minutes.
Planetarium shows in Arabic and English start at eleven AM, one PM, and four PM.
The gift shop stocks model rockets and closes thirty minutes before the centre.`,
        voice: "echo",
      },
      {
        questionStart: 16, questionEnd: 20,
        breakMessage: "You now have 30 seconds to look at Questions 16 to 20.",
        transcript: `Match each exhibit to its location.
The meteorite collection is in the north gallery, case three.
The astronaut training module is on level one beside the lift.
The satellite engineering workshop is in the east lab, staff-led only.
The children's rocket-building area is on level two, south corner.
The lecture auditorium is on level three with seating for two hundred.`,
        voice: "echo",
      },
      {
        questionStart: 21, questionEnd: 25,
        prepMessage: "You have 30 seconds to look at Questions 21 to 25.",
        transcript: `Supervisor: Outline your exoplanet detection project.
Reem: We're analysing transit data from the public Kepler archive.
Tariq: I'll process light curves using Python scripts.
Supervisor: How many candidate systems?
Reem: We shortlisted twelve with periodic dimming.
Tariq: We need to rule out binary star false positives.
Supervisor: Submit interim findings by the thirtieth of January.`,
        voice: "nova",
      },
      {
        questionStart: 26, questionEnd: 30,
        breakMessage: "You have 30 seconds to look at Questions 26 to 30.",
        transcript: `Supervisor: Match each task to the correct resource or person.
Reem: Raw data comes from the Kepler archive.
Tariq: Light curve scripts run on the department server.
Reem: False positive checks use the supervisor's checklist.
Tariq: Final graphs will go in appendix B.
Reem: Team meetings are Wednesdays at three PM.`,
        voice: "alloy",
      },
      {
        questionStart: 31, questionEnd: 40,
        prepMessage: "You have 30 seconds to look at Questions 31 to 40.",
        transcript: `This lecture introduces cosmology. The universe began with the Big Bang approximately thirteen point eight billion years ago.
Galaxies form through gravitational collapse of dark matter halos. Stars fuse hydrogen into helium in their cores.
Redshift indicates galaxies moving away as space expands. Black holes form when massive stars collapse beyond neutron degeneracy pressure.
The cosmic microwave background is relic radiation from the early universe. Dark energy accelerates expansion in the current epoch.`,
        voice: "shimmer",
      },
    ],
    questions: [
      [1, "form", "First name:", "Daniel"],
      [2, "form", "Surname:", "Brooks"],
      [3, "form", "Number of tickets:", "2"],
      [4, "form", "Phone:", "07812345678"],
      [5, "form", "Ticket price each:", "32"],
      [6, "note", "Session start:", "7:30 PM"],
      [7, "note", "Minimum age unaccompanied:", "10"],
      [8, "note", "Temperature below:", "10 degrees"],
      [9, "note", "Flash photography:", "prohibited"],
      [10, "note", "Check-in location:", "visitor pavilion"],
      [11, "mcq", "Friday hours:", "Until noon", ["Closed", "Until noon", "Until 6 PM", "24 hours"]],
      [12, "mcq", "Adult admission:", "55 SAR", ["30 SAR", "45 SAR", "55 SAR", "70 SAR"]],
      [13, "mcq", "Rover simulator level:", "Level 2", ["Level 1", "Level 2", "Level 3", "Basement"]],
      [14, "mcq", "Planetarium show times:", "11 AM, 1 PM, 4 PM", ["9 AM only", "11 AM, 1 PM, 4 PM", "Hourly", "Evenings only"]],
      [15, "mcq", "Gift shop closes:", "30 minutes before centre", ["At 4 PM", "At 6 PM", "30 minutes before centre", "Never"]],
      [16, "matching", "Meteorites:", "north gallery"],
      [17, "matching", "Training module:", "level one"],
      [18, "matching", "Satellite workshop:", "east lab"],
      [19, "matching", "Rocket building:", "level two south"],
      [20, "matching", "Auditorium:", "level three"],
      [21, "mcq", "Data source:", "Kepler archive", ["Hubble live", "Kepler archive", "Mars rover", "Gift shop"]],
      [22, "mcq", "Processing tool:", "Python", ["Excel only", "Python", "Word", "PowerPoint"]],
      [23, "mcq", "Shortlisted systems:", "12", ["5", "8", "12", "20"]],
      [24, "mcq", "False positives from:", "Binary stars", ["Moon phases", "Binary stars", "Clouds", "Satellites"]],
      [25, "mcq", "Interim deadline:", "30 January", ["30 November", "30 December", "30 January", "30 March"]],
      [26, "matching-features", "Raw data →", "Kepler archive"],
      [27, "matching-features", "Scripts →", "department server"],
      [28, "matching-features", "False positives →", "supervisor checklist"],
      [29, "matching-features", "Graphs →", "appendix B"],
      [30, "matching-features", "Meetings →", "Wednesdays 3 PM"],
      [31, "summary", "Universe origin event:", "Big Bang"],
      [32, "summary", "Age of universe (billion years):", "13.8"],
      [33, "summary", "Galaxies form via:", "gravitational collapse"],
      [34, "summary", "Stars fuse hydrogen into:", "helium"],
      [35, "summary", "Expansion indicator:", "redshift"],
      [36, "summary", "Massive star remnant:", "black holes"],
      [37, "summary", "Early universe radiation:", "cosmic microwave background"],
      [38, "summary", "Accelerates expansion:", "dark energy"],
      [39, "summary", "Invisible mass type:", "dark matter"],
      [40, "summary", "Current epoch driver:", "dark energy"],
    ],
  },
  {
    mockNumber: 5,
    introTexts: [
      "Section 1 of 4 — Listening. You will hear a call about an art gallery membership. Look at Questions 1 to 5.",
      "Section 2 of 4 — Listening. You will hear a talk about a cultural festival. Look at Questions 11 to 15.",
      "Section 3 of 4 — Listening. You will hear students discussing an exhibition review. Look at Questions 21 to 25.",
      "Section 4 of 4 — Listening. You will hear a lecture on arts and society. Look at Questions 31 to 40.",
    ],
    blocks: [
      {
        questionStart: 1, questionEnd: 5,
        formTitle: "Gallery Membership Application",
        prepMessage: "You have 30 seconds to look at Questions 1 to 5.",
        transcript: `Gallery: Edinburgh Contemporary Arts Centre membership line.
Caller: I'd like to join as a student member from the first of October.
Gallery: Can I take your first name?
Caller: Laura.
Gallery: And your surname?
Caller: Bennett — that's B-E-N-N-E-T-T.
Gallery: Student ID and phone number?
Caller: ID two zero two four five six, phone oh seven nine, one one two, two two three three four four.
Gallery: Student membership is fifty-five pounds annually.
Caller: Fifty-five?
Gallery: Sorry — actually forty-five pounds with a valid student card. I quoted the adult rate.
Caller: Forty-five — perfect. Does it include exhibition entry?
Gallery: Yes, unlimited entry and one guest pass per month.
Caller: Email address?
Caller: laura dot bennett at edinburgh dot ac dot uk.`,
        voice: "nova",
      },
      {
        questionStart: 6, questionEnd: 10,
        breakMessage: "You now have 30 seconds to look at Questions 6 to 10.",
        transcript: `Gallery: Collect your card from the foyer desk with photo ID.
Caller: Are workshops included?
Gallery: Members receive twenty percent off all studio workshops.
Caller: When is the new sculpture exhibition opening?
Gallery: The opening reception is on the fifth of October at six PM.
Caller: Is parking available?
Gallery: Underground parking is fifteen pounds flat rate for members.
Caller: Can I cancel membership?
Gallery: You may cancel anytime; refunds are not provided after thirty days.`,
        voice: "nova",
      },
      {
        questionStart: 11, questionEnd: 15,
        prepMessage: "You have 30 seconds to look at Questions 11 to 15.",
        transcript: `Welcome to the Riyadh Cultural Festival guide. The festival runs ten days from the twelfth of November.
Day passes cost seventy riyals; a full festival bracelet costs two hundred and twenty riyals.
Traditional craft demonstrations are in Tent Village, open eleven AM to nine PM.
International film screenings start at seven PM nightly in Cinema Square.
Family activities are free for children under twelve before four PM each day.`,
        voice: "fable",
      },
      {
        questionStart: 16, questionEnd: 20,
        breakMessage: "You now have 30 seconds to look at Questions 16 to 20.",
        transcript: `Match each event to its venue on the festival map.
The poetry stage is in the central plaza, north of the fountain.
The heritage food market is along the eastern promenade.
Contemporary dance performances are in the west amphitheatre.
The calligraphy masterclass is in Tent Village, booth seven.
First-aid stations are at all three main entrances.`,
        voice: "fable",
      },
      {
        questionStart: 21, questionEnd: 25,
        prepMessage: "You have 30 seconds to look at Questions 21 to 25.",
        transcript: `Curator: How will you structure your exhibition review?
Yasmin: I'll focus on the Saudi contemporary painting section.
Hassan: I'll analyse visitor engagement with the interactive installations.
Curator: Word limit?
Yasmin: Twelve hundred words, due the fourteenth of March.
Hassan: We'll visit together on the opening weekend.
Curator: Include comparison with last year's regional survey show.`,
        voice: "onyx",
      },
      {
        questionStart: 26, questionEnd: 30,
        breakMessage: "You have 30 seconds to look at Questions 26 to 30.",
        transcript: `Curator: Match each review section to its focus.
Yasmin: Painting section covers colour and cultural identity.
Hassan: Installations section discusses audience participation data.
Yasmin: Introduction references the regional survey show.
Hassan: Conclusion proposes improvements to gallery lighting.
Yasmin: Bibliography must include at least six academic sources.`,
        voice: "alloy",
      },
      {
        questionStart: 31, questionEnd: 40,
        prepMessage: "You have 30 seconds to look at Questions 31 to 40.",
        transcript: `This lecture explores arts and society. Cultural heritage strengthens collective identity across generations.
Public funding enables access to exhibitions that commercial markets might ignore. Digital archives preserve fragile manuscripts and oral traditions.
Community arts programmes reduce social isolation and build civic pride. Globalisation spreads styles rapidly but risks homogenising local expression.
Art education develops creativity transferable to science and entrepreneurship. Museums increasingly co-create content with source communities.`,
        voice: "shimmer",
      },
    ],
    questions: [
      [1, "form", "First name:", "Laura"],
      [2, "form", "Surname:", "Bennett"],
      [3, "form", "Membership starts:", "1 October"],
      [4, "form", "Phone:", "07911223344"],
      [5, "form", "Annual fee:", "45"],
      [6, "note", "Card collection:", "foyer desk"],
      [7, "note", "Workshop discount:", "20%"],
      [8, "note", "Opening reception:", "5 October"],
      [9, "note", "Parking rate:", "15"],
      [10, "note", "Refund policy:", "no refund after 30 days"],
      [11, "mcq", "Festival duration:", "10 days", ["5 days", "7 days", "10 days", "14 days"]],
      [12, "mcq", "Day pass:", "70 SAR", ["50 SAR", "60 SAR", "70 SAR", "90 SAR"]],
      [13, "mcq", "Craft demos location:", "Tent Village", ["Cinema Square", "Tent Village", "West amphitheatre", "Central plaza"]],
      [14, "mcq", "Films start:", "7 PM", ["5 PM", "6 PM", "7 PM", "9 PM"]],
      [15, "mcq", "Free family activities before:", "4 PM", ["12 PM", "2 PM", "4 PM", "6 PM"]],
      [16, "matching", "Poetry stage:", "central plaza"],
      [17, "matching", "Food market:", "eastern promenade"],
      [18, "matching", "Dance:", "west amphitheatre"],
      [19, "matching", "Calligraphy:", "Tent Village booth 7"],
      [20, "matching", "First aid:", "main entrances"],
      [21, "mcq", "Yasmin's focus:", "Saudi painting", ["Film schedule", "Saudi painting", "Parking fees", "Food market"]],
      [22, "mcq", "Hassan's focus:", "Interactive installations", ["Poetry stage", "Interactive installations", "Membership cards", "Bus routes"]],
      [23, "mcq", "Word limit:", "1200", ["800", "1000", "1200", "1500"]],
      [24, "mcq", "Deadline:", "14 March", ["14 January", "14 February", "14 March", "14 April"]],
      [25, "mcq", "Required comparison:", "Regional survey show", ["Food festival", "Regional survey show", "Sports event", "Tech fair"]],
      [26, "matching-features", "Painting section →", "cultural identity"],
      [27, "matching-features", "Installations →", "audience participation"],
      [28, "matching-features", "Introduction →", "regional survey"],
      [29, "matching-features", "Conclusion →", "gallery lighting"],
      [30, "matching-features", "Bibliography →", "six academic sources"],
      [31, "summary", "Strengthens identity:", "cultural heritage"],
      [32, "summary", "Enables non-commercial access:", "public funding"],
      [33, "summary", "Preserves manuscripts:", "digital archives"],
      [34, "summary", "Reduces isolation:", "community arts"],
      [35, "summary", "Risk of globalisation:", "homogenising"],
      [36, "summary", "Develops creativity:", "art education"],
      [37, "summary", "Co-creates with communities:", "museums"],
      [38, "summary", "Builds civic pride:", "community arts"],
      [39, "summary", "Preserves oral traditions:", "digital archives"],
      [40, "summary", "Spreads styles rapidly:", "globalisation"],
    ],
  },
];
