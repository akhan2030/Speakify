import type { CompactListeningVariant } from "./listeningVariantBuilder";

export const LISTENING_VARIANTS_3_TO_5: CompactListeningVariant[] = [
  {
    mockNumber: 3,
    introTexts: [
      "Section 1 of 4 — Listening. You will hear a student enrolling on a university course. Look at Questions 1 to 5.",
      "Section 2 of 4 — Listening. You will hear a talk about a learning support centre. Look at Questions 11 to 17.",
      "Section 3 of 4 — Listening. You will hear students preparing a conference paper. Look at Questions 21 to 25.",
      "Section 4 of 4 — Listening. You will hear a lecture on learning theories. Look at Questions 31 to 33.",
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
        transcript: `Admissions: Housing next.
Student: Yes — a single room, please.
Admissions: Halls open from the twenty-eighth of August.
Student: Meal plan?
Admissions: Eight hundred pounds per semester for early enrolments. The nine-hundred figure on the brochure is the late rate.
Student: Disability support?
Admissions: Contact the access office before the fifteenth of August.
Student: Nearest bus stop?
Admissions: On College Road — College Road.
Student: Orientation?
Admissions: First week of September, Monday nine AM in the main hall.`,
        voice: "nova",
      },
      {
        questionStart: 11, questionEnd: 17,
        prepMessage: "You have 30 seconds to look at Questions 11 to 17.",
        transcript: `Welcome to the Academic Skills Centre. Look at the floor plan carefully.
Printing is letter A — basement beside the IT help desk. The staff lounge is nearby; students can't book that room.
Quiet study pods are letter B on the third floor, east corridor. West corridor open-plan group work stays noisy.
The café is letter C, facing the courtyard on the ground floor.
Peer mentoring is letter D beside the main entrance.
Presentation practice is letter E in west wing W3 — not W1, which is storage now.
The digital literacy suite is letter F on the second floor with thirty workstations.
Maths drop-in is letter G, Room 12, Thursdays evenings.
Writing coaches sit at letter H on the first-floor mezzanine. Lockers are letter I by the south stairs. The bike shelter is letter J outside the east door.`,
        voice: "fable",
      },
      {
        questionStart: 18, questionEnd: 20,
        breakMessage: "You now have 30 seconds to look at Questions 18 to 20.",
        transcript: `Hours and free services.
Weekday hours are eight AM to six PM — closed weekends.
Which two services are free for enrolled students with no booking fee? One-to-one writing coaching, and peer mentoring at the entrance desk. Printing is charged per page, the café is paid, and evening maths drop-ins ask for a five-pound materials contribution.
So free without a booking fee: writing coaching and peer mentoring.`,
        voice: "fable",
      },
      {
        questionStart: 21, questionEnd: 25,
        prepMessage: "You have 30 seconds to look at Questions 21 to 25.",
        transcript: `Tutor: Checklist for your conference paper.
Omar: Abstract is done — two hundred words.
Lina: We still need stronger key words for the portal — keywords, yes.
Tutor: Manuscript?
Omar: The manuscript is almost ready. Wait — word count.
Lina: The brief says four thousand, not five.
Omar: Oh — sorry, actually four thousand. Five was the journal version.
Lina: References follow the style guide in APA seventh.
Tutor: Attach a short biography for each author.`,
        voice: "onyx",
      },
      {
        questionStart: 26, questionEnd: 30,
        breakMessage: "You have 30 seconds to look at Questions 26 to 30.",
        transcript: `Tutor: Follow the conference submission flow-chart.
Lina: First, create an online account.
Omar: Then upload the paper as a PDF.
Tutor: Next, select your topic stream from the drop-down list.
Lina: After that, pay the registration fee.
Omar: Finally, download the confirmation letter — keep it for travel claims.
Tutor: If payment fails, restart from the fee box; don't create a second account.`,
        voice: "alloy",
      },
      {
        questionStart: 31, questionEnd: 33,
        prepMessage: "You have 30 seconds to look at Questions 31 to 33.",
        transcript: `This lecture covers core learning theories. Constructivism emphasises learners building knowledge through experience.
Scaffolding is temporary support gradually removed as competence grows. Motivation research distinguishes intrinsic interest from extrinsic rewards.`,
        voice: "shimmer",
      },
      {
        questionStart: 34, questionEnd: 36,
        breakMessage: "You now have 30 seconds to look at Questions 34 to 36.",
        transcript: `On the zone-of-proximal-development diagram, the inner circle is what the learner can do alone — independent performance.
The middle band is the zone of proximal development, where help from a tutor makes success possible.
The outer area is beyond current reach — tasks that remain too difficult even with support.`,
        voice: "shimmer",
      },
      {
        questionStart: 37, questionEnd: 40,
        breakMessage: "You now have 30 seconds to look at Questions 37 to 40.",
        transcript: `Classroom problems: overload of new terms can block working memory.
Feedback that arrives too late loses impact.
Formative assessment during learning outperforms end-only testing for adjusting teaching.
Finally, peer discussion often deepens understanding when ground rules keep talk on task.`,
        voice: "shimmer",
      },
    ],
    questions: [
      [1, "form", "First name:", "Sophie"],
      [2, "form", "Surname:", "Clarke"],
      [3, "form", "Programme start:", "September"],
      [4, "form", "Phone:", "07700900456"],
      [5, "form", "Deposit:", "£2000/2000 pounds/two thousand"],
      [6, "note", "Housing type:", "single"],
      [7, "note", "Halls open:", "28 August"],
      [8, "note", "Meal plan cost:", "800/eight hundred"],
      [9, "note", "Access deadline:", "15 August"],
      [10, "note", "Bus stop street:", "College Road"],
      [11, "matching", "Printing:", "A", ["basement IT desk", "third-floor east pods", "courtyard café", "main entrance desk", "west wing W3", "second-floor suite", "Room 12", "mezzanine coaches", "south lockers", "east bike shelter"]],
      [12, "matching", "Quiet study pods:", "B", ["basement IT desk", "third-floor east pods", "courtyard café", "main entrance desk", "west wing W3", "second-floor suite", "Room 12", "mezzanine coaches", "south lockers", "east bike shelter"]],
      [13, "matching", "Café:", "C", ["basement IT desk", "third-floor east pods", "courtyard café", "main entrance desk", "west wing W3", "second-floor suite", "Room 12", "mezzanine coaches", "south lockers", "east bike shelter"]],
      [14, "matching", "Peer mentoring:", "D", ["basement IT desk", "third-floor east pods", "courtyard café", "main entrance desk", "west wing W3", "second-floor suite", "Room 12", "mezzanine coaches", "south lockers", "east bike shelter"]],
      [15, "matching", "Presentation practice:", "E", ["basement IT desk", "third-floor east pods", "courtyard café", "main entrance desk", "west wing W3", "second-floor suite", "Room 12", "mezzanine coaches", "south lockers", "east bike shelter"]],
      [16, "matching", "Digital literacy suite:", "F", ["basement IT desk", "third-floor east pods", "courtyard café", "main entrance desk", "west wing W3", "second-floor suite", "Room 12", "mezzanine coaches", "south lockers", "east bike shelter"]],
      [17, "matching", "Maths drop-in:", "G", ["basement IT desk", "third-floor east pods", "courtyard café", "main entrance desk", "west wing W3", "second-floor suite", "Room 12", "mezzanine coaches", "south lockers", "east bike shelter"]],
      [18, "mcq", "Weekend hours:", "Closed", ["8 AM–6 PM", "9 AM–5 PM", "Closed"]],
      [19, "mcq", "Which TWO services are free with no booking fee?", "D", ["printing", "café", "maths drop-in", "writing coaching", "peer mentoring"], { chooseCount: 2, eitherOrderGroup: "mock3-s2-19-20" }],
      [20, "mcq", "Which TWO services are free with no booking fee?", "E", ["printing", "café", "maths drop-in", "writing coaching", "peer mentoring"], { chooseCount: 2, eitherOrderGroup: "mock3-s2-19-20" }],
      [21, "note", "Checklist — short summary:", "abstract"],
      [22, "note", "Portal needs:", "key words/keywords"],
      [23, "note", "Upload:", "(the) manuscript/manuscript"],
      [24, "note", "Word limit:", "4000/four thousand"],
      [25, "note", "Follow the:", "style guide"],
      [26, "flowchart", "1. Create an online _____", "account"],
      [27, "flowchart", "2. Upload the paper as a _____", "PDF"],
      [28, "flowchart", "3. Select your topic _____", "stream"],
      [29, "flowchart", "4. Pay the registration _____", "fee"],
      [30, "flowchart", "5. Download the confirmation _____", "letter"],
      [31, "summary", "Knowledge through experience:", "constructivism"],
      [32, "summary", "Temporary support removed later:", "scaffolding"],
      [33, "summary", "Interest from within is:", "intrinsic"],
      [34, "diagram", "Inner circle — can do:", "alone/independent"],
      [35, "diagram", "Middle band:", "proximal development/ZPD"],
      [36, "diagram", "Outer area — too:", "difficult"],
      [37, "note", "Too many terms cause:", "overload"],
      [38, "note", "Late comments lose:", "impact"],
      [39, "note", "Assessment during learning:", "formative"],
      [40, "note", "On-task talk deepens:", "understanding"],
    ],
  },
  {
    mockNumber: 4,
    introTexts: [
      "Section 1 of 4 — Listening. You will hear a booking for an observatory visit. Look at Questions 1 to 5.",
      "Section 2 of 4 — Listening. You will hear a talk about a space education centre. Look at Questions 11 to 17.",
      "Section 3 of 4 — Listening. You will hear students planning a research poster. Look at Questions 21 to 25.",
      "Section 4 of 4 — Listening. You will hear a lecture on stellar evolution. Look at Questions 31 to 33.",
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
Caller: Thirty-two — fine.
Booking: Email for the confirmation?
Caller: daniel dot brooks at outlook dot com.`,
        voice: "onyx",
      },
      {
        questionStart: 6, questionEnd: 10,
        breakMessage: "You now have 30 seconds to look at Questions 6 to 10.",
        transcript: `Booking: A few visitor rules.
Caller: What time does the session start?
Booking: Seven thirty PM after sunset — not seven, which is café closing.
Caller: Minimum age alone?
Booking: Ten — under ten must bring an adult.
Caller: Temperature?
Booking: It often drops below ten degrees — bring warm layers.
Caller: Photography?
Booking: Flash is prohibited near the telescopes.
Caller: Check-in?
Booking: At the visitor pavilion on Park Row — Park Row.`,
        voice: "onyx",
      },
      {
        questionStart: 11, questionEnd: 17,
        prepMessage: "You have 30 seconds to look at Questions 11 to 17.",
        transcript: `Welcome to the National Space Education Centre. Please open the centre map.
The astronaut training module is letter A on level one beside the lift.
Children's rocket-building is letter B on level two, south corner.
The satellite engineering workshop is letter C in the east lab — staff-led only.
Meteorites are letter D in the north gallery, case three.
The lecture auditorium is letter E on level three, seating two hundred.
The Mars rover simulator is letter F on level two near the escalators.
Planetarium doors are letter G on level one west. The gift shop is letter H by the exit.
West café is letter I on level one — refreshments only. Coach drop-off is letter J on the south forecourt.`,
        voice: "echo",
      },
      {
        questionStart: 18, questionEnd: 20,
        breakMessage: "You now have 30 seconds to look at Questions 18 to 20.",
        transcript: `Opening notes for school visits.
Most days we open ten AM to eight PM, but Fridays we close at noon for deep cleaning — not fully closed all day.
Which two facilities stay open on Friday mornings before noon? The planetarium still runs its eleven AM show, and the meteorite gallery remains open. The rover simulator and rocket-building workshops pause for cleaning, and the auditorium is booked for staff training.
So Friday morning: planetarium and meteorite gallery.`,
        voice: "echo",
      },
      {
        questionStart: 21, questionEnd: 25,
        prepMessage: "You have 30 seconds to look at Questions 21 to 25.",
        transcript: `Supervisor: Poster checklist for the faculty showcase.
Reem: Title and authors are set.
Tariq: We need clearer key words under the abstract box — keywords.
Supervisor: Methods section?
Reem: Done. Results show twelve candidate systems… wait.
Tariq: After filtering it's twelve, yes — not twenty.
Reem: Oh — sorry, actually twelve. Twenty was before the quality cut.
Tariq: References follow the department style guide.
Supervisor: Print on A0 and bring spare blue-tack.`,
        voice: "nova",
      },
      {
        questionStart: 26, questionEnd: 30,
        breakMessage: "You have 30 seconds to look at Questions 26 to 30.",
        transcript: `Supervisor: Printing flow-chart for posters.
Tariq: First, export the file as a PDF.
Reem: Then check the dimensions — width and height in millimetres.
Supervisor: Next, upload to the print portal.
Tariq: Collect the proof copy the next day.
Reem: If the proof is fine, approve the final print. If not, correct and re-export.
Supervisor: Don't skip the proof step — colour errors are common.`,
        voice: "alloy",
      },
      {
        questionStart: 31, questionEnd: 33,
        prepMessage: "You have 30 seconds to look at Questions 31 to 33.",
        transcript: `This lecture introduces stellar evolution. Stars form when gravity collapses cold clouds of gas and dust.
Core fusion converts hydrogen into helium and releases energy. Later stages depend strongly on the star's initial mass.`,
        voice: "shimmer",
      },
      {
        questionStart: 34, questionEnd: 36,
        breakMessage: "You now have 30 seconds to look at Questions 34 to 36.",
        transcript: `Label the life-cycle diagram for a sun-like star. The first stage is a nebula — the birth cloud.
The long stable phase is the main sequence, where hydrogen burns steadily.
Near the end, the star expands into a red giant before shedding outer layers.`,
        voice: "shimmer",
      },
      {
        questionStart: 37, questionEnd: 40,
        breakMessage: "You now have 30 seconds to look at Questions 37 to 40.",
        transcript: `Observational challenges: dust extinction dims distant stars in the optical band.
Crowding in dense clusters confuses photometry.
Spectroscopy reveals composition; redshift indicates motion away from us.
Finally, space telescopes avoid atmospheric distortion that limits ground sites.`,
        voice: "shimmer",
      },
    ],
    questions: [
      [1, "form", "First name:", "Daniel"],
      [2, "form", "Surname:", "Brooks"],
      [3, "form", "Number of tickets:", "2/two"],
      [4, "form", "Phone:", "07812345678"],
      [5, "form", "Ticket price each:", "£32/32 pounds/thirty-two"],
      [6, "note", "Session start:", "7.30/7:30"],
      [7, "note", "Minimum age alone:", "10/ten"],
      [8, "note", "Temperature below (°C):", "10/ten"],
      [9, "note", "Flash photography:", "prohibited/banned"],
      [10, "note", "Check-in street:", "Park Row"],
      [11, "matching", "Training module:", "A", ["level one lift", "level two south", "east lab", "north gallery", "level three auditorium", "level two simulator", "level one west planetarium", "exit gift shop", "level one west café", "south forecourt"]],
      [12, "matching", "Rocket building:", "B", ["level one lift", "level two south", "east lab", "north gallery", "level three auditorium", "level two simulator", "level one west planetarium", "exit gift shop", "level one west café", "south forecourt"]],
      [13, "matching", "Satellite workshop:", "C", ["level one lift", "level two south", "east lab", "north gallery", "level three auditorium", "level two simulator", "level one west planetarium", "exit gift shop", "level one west café", "south forecourt"]],
      [14, "matching", "Meteorites:", "D", ["level one lift", "level two south", "east lab", "north gallery", "level three auditorium", "level two simulator", "level one west planetarium", "exit gift shop", "level one west café", "south forecourt"]],
      [15, "matching", "Auditorium:", "E", ["level one lift", "level two south", "east lab", "north gallery", "level three auditorium", "level two simulator", "level one west planetarium", "exit gift shop", "level one west café", "south forecourt"]],
      [16, "matching", "Rover simulator:", "F", ["level one lift", "level two south", "east lab", "north gallery", "level three auditorium", "level two simulator", "level one west planetarium", "exit gift shop", "level one west café", "south forecourt"]],
      [17, "matching", "Planetarium:", "G", ["level one lift", "level two south", "east lab", "north gallery", "level three auditorium", "level two simulator", "level one west planetarium", "exit gift shop", "level one west café", "south forecourt"]],
      [18, "mcq", "Friday hours:", "Until noon", ["Closed all day", "Until noon", "Until 6 PM"]],
      [19, "mcq", "Which TWO stay open Friday morning?", "D", ["rover simulator", "rocket building", "auditorium", "planetarium", "meteorite gallery"], { chooseCount: 2, eitherOrderGroup: "mock4-s2-19-20" }],
      [20, "mcq", "Which TWO stay open Friday morning?", "E", ["rover simulator", "rocket building", "auditorium", "planetarium", "meteorite gallery"], { chooseCount: 2, eitherOrderGroup: "mock4-s2-19-20" }],
      [21, "note", "Poster needs clear:", "key words/keywords"],
      [22, "note", "Candidate systems after filter:", "12/twelve"],
      [23, "note", "Follow the department:", "style guide"],
      [24, "note", "Print size:", "A0"],
      [25, "note", "Bring spare:", "blue-tack/blu-tack"],
      [26, "flowchart", "1. Export as a _____", "PDF"],
      [27, "flowchart", "2. Check the _____", "dimensions"],
      [28, "flowchart", "3. Upload to the print _____", "portal"],
      [29, "flowchart", "4. Collect the _____ copy", "proof"],
      [30, "flowchart", "5. _____ the final print", "approve"],
      [31, "summary", "Stars form by gravity in:", "clouds/gas clouds"],
      [32, "summary", "Core fusion makes hydrogen into:", "helium"],
      [33, "summary", "Later stages depend on initial:", "mass"],
      [34, "diagram", "Birth cloud stage:", "nebula"],
      [35, "diagram", "Stable hydrogen-burning phase:", "main sequence"],
      [36, "diagram", "Expanded late stage:", "red giant"],
      [37, "note", "Dust causes:", "extinction"],
      [38, "note", "Dense clusters cause:", "crowding"],
      [39, "note", "Composition tool:", "spectroscopy"],
      [40, "note", "Space telescopes avoid atmospheric:", "distortion"],
    ],
  },
  {
    mockNumber: 5,
    introTexts: [
      "Section 1 of 4 — Listening. You will hear a call about an art gallery membership. Look at Questions 1 to 5.",
      "Section 2 of 4 — Listening. You will hear a talk about a cultural festival site. Look at Questions 11 to 17.",
      "Section 3 of 4 — Listening. You will hear students preparing an exhibition catalogue entry. Look at Questions 21 to 25.",
      "Section 4 of 4 — Listening. You will hear a lecture on museum conservation. Look at Questions 31 to 33.",
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
Gallery: Phone number?
Caller: Oh seven nine, one one two, two two three three four four.
Gallery: Student membership is fifty-five pounds annually.
Caller: Fifty-five?
Gallery: Sorry — actually forty-five pounds with a valid student card. I quoted the adult rate.
Caller: Forty-five — perfect.
Gallery: Email address?
Caller: laura dot bennett at edinburgh dot ac dot uk.`,
        voice: "nova",
      },
      {
        questionStart: 6, questionEnd: 10,
        breakMessage: "You now have 30 seconds to look at Questions 6 to 10.",
        transcript: `Gallery: A few membership details.
Caller: Where do I collect the card?
Gallery: From the foyer desk with photo ID.
Caller: Workshop discount?
Gallery: Twenty percent off studio workshops — twenty.
Caller: Opening of the sculpture show?
Gallery: Fifth of October at six PM.
Caller: Parking?
Gallery: Fifteen pounds flat rate underground.
Caller: Nearest tram stop?
Gallery: On Princes Street — Princes Street.`,
        voice: "nova",
      },
      {
        questionStart: 11, questionEnd: 17,
        prepMessage: "You have 30 seconds to look at Questions 11 to 17.",
        transcript: `Welcome to the Riyadh Cultural Festival site map.
The heritage food market is letter A along the eastern promenade. The north car park is vehicles only.
Contemporary dance is letter B in the west amphitheatre.
Poetry is letter C in the central plaza, north of the fountain.
Calligraphy masterclasses are letter D in Tent Village, booth seven — not booth three.
First-aid stations are letter E at all three main entrances.
Cinema Square is letter F for evening films.
Family craft tents are letter G beside the south lawn.
Volunteer HQ is letter H behind the information tower. Quiet prayer room is letter I near the west gate. Lost-and-found is letter J at the south ticket booth.`,
        voice: "fable",
      },
      {
        questionStart: 18, questionEnd: 20,
        breakMessage: "You now have 30 seconds to look at Questions 18 to 20.",
        transcript: `Festival timing and free activities.
The festival runs ten days from the twelfth of November — not seven days as early publicity suggested.
Which two activities are free for children under twelve before four PM? Family craft tents, and storytelling in the poetry plaza. Film screenings are ticketed, calligraphy classes need pre-booking, and the food market stalls charge for everything.
So free before four for under-twelves: craft tents and storytelling.`,
        voice: "fable",
      },
      {
        questionStart: 21, questionEnd: 25,
        prepMessage: "You have 30 seconds to look at Questions 21 to 25.",
        transcript: `Curator: Catalogue entry checklist.
Yasmin: We've drafted the artist biography.
Hassan: Still need three key words for the index — keywords.
Curator: Image captions?
Yasmin: Done. Word limit for the critical note is four hundred… wait.
Hassan: The brief says three hundred.
Yasmin: Oh — sorry, actually three hundred. Four hundred was last year's catalogue.
Hassan: Citations follow the museum style guide.
Curator: Submit the manuscript by Friday noon.`,
        voice: "onyx",
      },
      {
        questionStart: 26, questionEnd: 30,
        breakMessage: "You have 30 seconds to look at Questions 26 to 30.",
        transcript: `Curator: Editorial flow-chart for catalogue pages.
Hassan: First, draft the text offline.
Yasmin: Then send it for peer review by another student editor.
Curator: After comments, revise the wording.
Hassan: Next, a copy-edit for spelling and house style.
Yasmin: Finally, approve the layout proof before printing.
Curator: If the proof fails, return to revise — don't jump straight to printing.`,
        voice: "alloy",
      },
      {
        questionStart: 31, questionEnd: 33,
        prepMessage: "You have 30 seconds to look at Questions 31 to 33.",
        transcript: `This lecture explores museum conservation. Preventive care slows damage before restoration is needed.
Stable temperature and humidity protect organic materials such as paper and textiles. Light exposure must be limited for pigments that fade.`,
        voice: "shimmer",
      },
      {
        questionStart: 34, questionEnd: 36,
        breakMessage: "You now have 30 seconds to look at Questions 34 to 36.",
        transcript: `Label the climate-control diagram for a display case. The outer shell is the insulated case wall.
Inside that, sensors monitor humidity continuously.
At the centre sits the silica gel compartment that buffers moisture — some diagrams call it a desiccant pack; use silica gel here.`,
        voice: "shimmer",
      },
      {
        questionStart: 37, questionEnd: 40,
        breakMessage: "You now have 30 seconds to look at Questions 37 to 40.",
        transcript: `Threats and responses: mould thrives when humidity stays too high.
Insects can attack wood and wool if cases are poorly sealed.
Digital archives back up fragile manuscripts and oral recordings.
Community co-curation builds trust and improves interpretation accuracy.`,
        voice: "shimmer",
      },
    ],
    questions: [
      [1, "form", "First name:", "Laura"],
      [2, "form", "Surname:", "Bennett"],
      [3, "form", "Membership starts:", "1 October/(the) 1(st) October"],
      [4, "form", "Phone:", "07911223344"],
      [5, "form", "Annual fee:", "£45/45 pounds/forty-five"],
      [6, "note", "Card collection:", "foyer"],
      [7, "note", "Workshop discount (%):", "20/twenty"],
      [8, "note", "Sculpture opening:", "5 October"],
      [9, "note", "Parking rate:", "15/fifteen"],
      [10, "note", "Tram stop street:", "Princes Street"],
      [11, "matching", "Food market:", "A", ["eastern promenade", "west amphitheatre", "central plaza", "Tent Village booth 7", "main entrances", "Cinema Square", "south lawn crafts", "information tower HQ", "west gate prayer room", "south ticket booth"]],
      [12, "matching", "Dance:", "B", ["eastern promenade", "west amphitheatre", "central plaza", "Tent Village booth 7", "main entrances", "Cinema Square", "south lawn crafts", "information tower HQ", "west gate prayer room", "south ticket booth"]],
      [13, "matching", "Poetry:", "C", ["eastern promenade", "west amphitheatre", "central plaza", "Tent Village booth 7", "main entrances", "Cinema Square", "south lawn crafts", "information tower HQ", "west gate prayer room", "south ticket booth"]],
      [14, "matching", "Calligraphy:", "D", ["eastern promenade", "west amphitheatre", "central plaza", "Tent Village booth 7", "main entrances", "Cinema Square", "south lawn crafts", "information tower HQ", "west gate prayer room", "south ticket booth"]],
      [15, "matching", "First aid:", "E", ["eastern promenade", "west amphitheatre", "central plaza", "Tent Village booth 7", "main entrances", "Cinema Square", "south lawn crafts", "information tower HQ", "west gate prayer room", "south ticket booth"]],
      [16, "matching", "Cinema Square:", "F", ["eastern promenade", "west amphitheatre", "central plaza", "Tent Village booth 7", "main entrances", "Cinema Square", "south lawn crafts", "information tower HQ", "west gate prayer room", "south ticket booth"]],
      [17, "matching", "Family craft tents:", "G", ["eastern promenade", "west amphitheatre", "central plaza", "Tent Village booth 7", "main entrances", "Cinema Square", "south lawn crafts", "information tower HQ", "west gate prayer room", "south ticket booth"]],
      [18, "mcq", "Festival duration:", "10 days", ["5 days", "7 days", "10 days"]],
      [19, "mcq", "Which TWO are free for under-12s before 4 PM?", "D", ["film screenings", "calligraphy classes", "food stalls", "family craft tents", "storytelling"], { chooseCount: 2, eitherOrderGroup: "mock5-s2-19-20" }],
      [20, "mcq", "Which TWO are free for under-12s before 4 PM?", "E", ["film screenings", "calligraphy classes", "food stalls", "family craft tents", "storytelling"], { chooseCount: 2, eitherOrderGroup: "mock5-s2-19-20" }],
      [21, "note", "Index needs:", "key words/keywords"],
      [22, "note", "Critical note maximum words:", "300/three hundred"],
      [23, "note", "Follow the museum:", "style guide"],
      [24, "note", "Submit:", "(the) manuscript/manuscript"],
      [25, "note", "Deadline day:", "Friday"],
      [26, "flowchart", "1. _____ the text offline", "draft"],
      [27, "flowchart", "2. Send for peer _____", "review"],
      [28, "flowchart", "3. _____ the wording", "revise"],
      [29, "flowchart", "4. Complete a _____ for spelling", "copy-edit/copyedit"],
      [30, "flowchart", "5. _____ the layout proof", "approve"],
      [31, "summary", "Care that slows damage:", "preventive"],
      [32, "summary", "Stable air conditions protect:", "paper/textiles"],
      [33, "summary", "Limit light to stop pigments that:", "fade"],
      [34, "diagram", "Outer shell:", "case wall/insulated wall"],
      [35, "diagram", "Devices that monitor moisture:", "sensors"],
      [36, "diagram", "Moisture buffer at centre:", "silica gel"],
      [37, "note", "High humidity encourages:", "mould/mold"],
      [38, "note", "Poor seals allow:", "insects"],
      [39, "note", "Backups of fragile texts:", "digital archives"],
      [40, "note", "Shared curation builds:", "trust"],
    ],
  },
];
