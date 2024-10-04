// app/page.tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';
import logo from './images/logo.png';

interface Flashcard {
  front: string;
  back: string;
  starred: boolean;
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [notes, setNotes] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showFront, setShowFront] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [error, setError] = useState('');
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Helper function to get a random sample from an array
  function getRandomSample<T>(array: T[], sampleSize: number): T[] {
    const shuffled = array.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  }

  const handleNext = async () => {
    setLoading(true);
    setError('');

    const prompt = `Generate comprehensive flashcards based on the following notes. Ensure the flashcards cover all of the uploaded notes. Make at least 50 flashcards. Additionally, generate questions that may be asked based on the content in the notes in an exam:

IMPORTANT: notes are in the <notes></notes> tag and flashcards should only be generated from those notes:
<notes>
${notes}
</notes>

Output the flashcards in the following format:

<flashcards>
    <flashcard>
        <front>
        </front>
        <back>
        </back>
    </flashcard>
    <flashcard>
        <front>
        What is IP?
        </front>
        <back>
        </back>
    </flashcard>
    <flashcard>
        <front>
        </front>
        <back>
        </back>
    </flashcard>
    <!-- more flashcards -->
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
          model: 'gpt-4', // Use 'gpt-4' if you have access
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage = data.choices[0].message.content;

        // Parse the assistantMessage to extract flashcards
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(assistantMessage, 'text/xml');

        const flashcardNodes = xmlDoc.getElementsByTagName('flashcard');

        const parsedFlashcards: Flashcard[] = [];

        for (let i = 0; i < flashcardNodes.length; i++) {
          const flashcardNode = flashcardNodes[i];
          const frontNode = flashcardNode.getElementsByTagName('front')[0];
          const backNode = flashcardNode.getElementsByTagName('back')[0];

          const front = frontNode ? frontNode.textContent?.trim() || '' : '';
          const back = backNode ? backNode.textContent?.trim() || '' : '';

          parsedFlashcards.push({ front, back, starred: false });
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

  const generateMoreFlashcards = async () => {
    setIsGeneratingMore(true);
    setError('');

    // Get starred and non-starred flashcards
    const starredFlashcards = flashcards.filter((card) => card.starred);
    const nonStarredFlashcards = flashcards.filter((card) => !card.starred);

    // Randomly sample 10 non-starred flashcards
    const sampleSize = Math.min(10, nonStarredFlashcards.length);
    const randomNonStarredFlashcards = getRandomSample(nonStarredFlashcards, sampleSize);

    // Format the starred flashcards into the prompt
    let starredFlashcardsText = '';
    if (starredFlashcards.length > 0) {
      starredFlashcardsText =
        'Here are some flashcards that I found challenging or important. Please create new flashcards that explore these topics in new or deeper ways.\n\n';

      starredFlashcards.forEach((card) => {
        starredFlashcardsText += `<flashcard>\n<front>\n${card.front}\n</front>\n<back>\n${card.back}\n</back>\n</flashcard>\n`;
      });
    }

    // Format the randomly sampled non-starred flashcards into the prompt
    let nonStarredFlashcardsText = '';
    if (randomNonStarredFlashcards.length > 0) {
      nonStarredFlashcardsText =
        'Here are some other topics I have studied. Please create new flashcards that explore these topics in new or deeper ways.\n\n';

      randomNonStarredFlashcards.forEach((card) => {
        nonStarredFlashcardsText += `<flashcard>\n<front>\n${card.front}\n</front>\n<back>\n${card.back}\n</back>\n</flashcard>\n`;
      });
    }

    const prompt = `Generate more comprehensive flashcards based on the following notes. Ensure there are enough flashcards to cover all of the uploaded notes. Additionally, generate questions that may be asked based on the content in the notes in an exam.



These flashcards were starred for further review:
${starredFlashcardsText}

And these are a sample of flashcards that have been successfully completed:
${nonStarredFlashcardsText}

IMPORTANT: notes are in the <notes></notes> tag and flashcards should only be generated from those notes:
<notes>
${notes}
</notes>

Output the flashcards in the following format:

<flashcards>
    <flashcard>
        <front>
        </front>
        <back>
        </back>
    </flashcard>
    <flashcard>
        <front>
        What is IP?
        </front>
        <back>
        </back>
    </flashcard>
    <flashcard>
        <front>
        </front>
        <back>
        </back>
        <!-- more flashcards -->
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
          model: 'gpt-4', // Use 'gpt-4' if you have access
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage = data.choices[0].message.content;

        // Parse the assistantMessage to extract flashcards
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(assistantMessage, 'text/xml');

        const flashcardNodes = xmlDoc.getElementsByTagName('flashcard');

        const parsedFlashcards: Flashcard[] = [];

        for (let i = 0; i < flashcardNodes.length; i++) {
          const flashcardNode = flashcardNodes[i];
          const frontNode = flashcardNode.getElementsByTagName('front')[0];
          const backNode = flashcardNode.getElementsByTagName('back')[0];

          const front = frontNode ? frontNode.textContent?.trim() || '' : '';
          const back = backNode ? backNode.textContent?.trim() || '' : '';

          parsedFlashcards.push({ front, back, starred: false });
        }

        // Append the new flashcards to the existing ones
        setFlashcards((prevFlashcards) => [...prevFlashcards, ...parsedFlashcards]);
      } else {
        setError(data.error.message || 'Error fetching data from OpenAI API');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching data.');
    } finally {
      setIsGeneratingMore(false);
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
    if (currentCardIndex === filteredFlashcards.length - 1) {
      // At the last card, generate more flashcards
      if (!isGeneratingMore) {
        generateMoreFlashcards();
      }
    } else {
      setCurrentCardIndex((prevIndex) =>
        Math.min(prevIndex + 1, filteredFlashcards.length - 1)
      );
      setShowFront(true);
    }
  };

  const handleToggleStar = () => {
    const updatedFlashcards = [...flashcards];
    const currentCard = filteredFlashcards[currentCardIndex];
    const currentIndexInAll = flashcards.findIndex((card) => card === currentCard);
    updatedFlashcards[currentIndexInAll].starred = !updatedFlashcards[currentIndexInAll].starred;
    setFlashcards(updatedFlashcards);
  };

  const handleToggleShowStarred = () => {
    setShowStarredOnly(!showStarredOnly);
    setCurrentCardIndex(0);
    setShowFront(true);
  };

  const filteredFlashcards = showStarredOnly
    ? flashcards.filter((card) => card.starred)
    : flashcards;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {flashcards.length === 0 ? (
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-center">
          <Image
            className="mx-auto block"
            src={logo}
            alt="Your Custom Logo"
            width={50} /* Adjust width as needed */
            height={50} /* Adjust height as needed */
            priority
          />

          <div className="max-w-md">
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
        <main className="flex flex-col gap-4 row-start-2 items-center sm:items-center">
          <div
            onClick={handleFlip}
            className="relative cursor-pointer border border-gray-300 rounded p-8 text-center mb-4 w-80 h-40 flex items-center justify-center"
          >
            {showFront
              ? filteredFlashcards[currentCardIndex]?.front
              : filteredFlashcards[currentCardIndex]?.back}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStar();
              }}
              className="absolute top-2 right-2"
            >
              {filteredFlashcards[currentCardIndex]?.starred ? '★' : '☆'}
            </button>
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
              disabled={
                isGeneratingMore && currentCardIndex === filteredFlashcards.length - 1
              }
              className="bg-gray-500 text-white p-2 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
          {isGeneratingMore && (
            <p className="text-gray-500 mt-4">Generating more flashcards...</p>
          )}
          <div className="w-80 flex justify-center mt-4">
            <button
              onClick={handleToggleShowStarred}
              className="bg-blue-500 text-white p-2 rounded"
            >
              {showStarredOnly ? 'Show All Cards' : 'Show Starred Only'}
            </button>
          </div>
          {filteredFlashcards.length === 0 && showStarredOnly && (
            <p className="text-red-500 mt-4">No starred cards available.</p>
          )}
        </main>
      )}
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        {/* Your existing footer content */}
      </footer>
    </div>
  );
}