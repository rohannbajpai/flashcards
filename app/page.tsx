// app/page.tsx
'use client'
import { useState } from 'react';
import Image from 'next/image';
import logo from './images/logo.png';

interface Flashcard {
  front: string;
  back: string;
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [notes, setNotes] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showFront, setShowFront] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    setLoading(true);
    setError('');

    const prompt = `Generate comprehensive flashcards based on the following notes. Ensure the flashcards cover all of the uploaded notes. Make at least 50 flashcards. Additonally, generate questions that may be asked based on the content in the notes in an exam:

${notes}

Output the flashcards in the following format:

<flashcards>
    <flashcard>
        <front>
        What is BGP?
        </front>
        <back>
        BGP is a protocol that allows Autonomous Systems to communicate with other Autonomous Systems via the Internet
        </back>
    </flashcard>
    <flashcard>
        <front>
        What is IP?
        </front>
        <back>
        IP is a protocol that enables the Internet.
        </back>
    </flashcard>
    <flashcard>
        <front>
        Suppose a IP fragment with ID 1023, offset 128, MF=0, DF=0, TTL=172 and payload size 552 bytes is transmitted on a link with MTU 276 bytes. List the header values for the resultant frag- ments. You may assume no IP options; IP Len includes header, and that link MTU of x means an IP datagram of total length x can be sent over the link.
        </front>
        <back>
        ID    Offset   MF   DF   TTL     Len
        0      1023    128   0     171    276
        1      1023    160   0     171    276    
        2      1023    192   0     171    60
        3      0       0     0     171    0    
        </back>
    </flashcard>
</flashcards>

`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Use 'gpt-4' if you have access
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage = data.choices[0].message.content;

        // Parse the assistantMessage to extract flashcards
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(assistantMessage, "text/xml");

        const flashcardNodes = xmlDoc.getElementsByTagName('flashcard');

        const parsedFlashcards: Flashcard[] = [];

        for (let i = 0; i < flashcardNodes.length; i++) {
          const flashcardNode = flashcardNodes[i];
          const frontNode = flashcardNode.getElementsByTagName('front')[0];
          const backNode = flashcardNode.getElementsByTagName('back')[0];

          const front = frontNode ? frontNode.textContent?.trim() || '' : '';
          const back = backNode ? backNode.textContent?.trim() || '' : '';

          parsedFlashcards.push({ front, back });
        }

        setFlashcards(parsedFlashcards);
      } else {
        setError(data.error.message || 'Error fetching data from OpenAI API');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setShowFront(!showFront);
  };

  const handlePrevCard = () => {
    setCurrentCardIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    setShowFront(true);
  };

  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) => Math.min(prevIndex + 1, flashcards.length - 1));
    setShowFront(true);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {flashcards.length === 0 ? (
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src={logo}
          alt="Your Custom Logo"
          width={50} /* Adjust width as needed */
          height={50} /* Adjust height as needed */
          priority
        />

          <div className="max-w-md">
            <h1 className="text-2xl font-bold mb-4">Flashcard Generator</h1>
            <div className="mb-4">
              <label className="block mb-2">OpenAI API Key:</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Notes:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded h-32"
              />
            </div>
            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full bg-black text-white p-2 rounded"
            >
              {loading ? 'Generating...' : 'Next'}
            </button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        </main>
      ) : (
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-center">
          <div
            onClick={handleFlip}
            className="cursor-pointer border border-gray-300 rounded p-8 text-center mb-4 w-80 h-40 flex items-center justify-center"
          >
            {showFront
              ? flashcards[currentCardIndex].front
              : flashcards[currentCardIndex].back}
          </div>
          <div className="flex justify-between w-80">
            <button
              onClick={handlePrevCard}
              disabled={currentCardIndex === 0}
              className="bg-gray-500 text-white p-2 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={handleNextCard}
              disabled={currentCardIndex === flashcards.length - 1}
              className="bg-gray-500 text-white p-2 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </main>
      )}
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        {/* Your existing footer content */}
      </footer>
    </div>
  );
}