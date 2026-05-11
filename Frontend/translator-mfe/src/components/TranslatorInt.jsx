import React, { useState, useEffect } from 'react';

const Translator = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isBmmToMg, setIsBmmToMg] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const ACCESS_TOKEN = "eyJ4NXQiOiJNekF6TVRGak9EUTFNRE5qT1RVMVpEQTROR1E1TURrell6RTNNV0k0TW1SbFpHVTNZelpqWWprNFpHUmtNMlJoTW1Jd01qQXhZekpsTUdKak5qZG1OdyIsImtpZCI6Ik16QXpNVEZqT0RRMU1ETmpPVFUxWkRBNE5HUTVNRGt6WXpFM01XSTRNbVJsWkdVM1l6WmpZams0WkdSa00yUmhNbUl3TWpBeFl6SmxNR0pqTmpkbU53X1JTMjU2IiwidHlwIjoiYXQrand0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiIzNzhiNTI5NS0wMDU5LTQ5ZmUtOTMwYS0wZDc5NmY0MjA2YmEiLCJhdXQiOiJBUFBMSUNBVElPTiIsImF1ZCI6Ik83b1FNa1R3bzJBZmkxSTN1eWU3Ymt2TGxTUWEiLCJuYmYiOjE3NzgyODA2OTksImF6cCI6Ik83b1FNa1R3bzJBZmkxSTN1eWU3Ymt2TGxTUWEiLCJzY29wZSI6ImRlZmF1bHQiLCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo5NDQzL29hdXRoMi90b2tlbiIsImV4cCI6MTc3ODI4NDI5OSwiaWF0IjoxNzc4MjgwNjk5LCJqdGkiOiJjYTk1MmJhZi02ODQ5LTRkN2YtYThlOC04MGFhM2MwM2YwNjEiLCJjbGllbnRfaWQiOiJPN29RTWtUd28yQWZpMUkzdXllN2JrdkxsU1FhIn0.sePNGie7kZ_sK82WltF0ZH9h9XrcwFYlPcUYQft_3QjzhpbJxX1R3U3aLLr3e--QkKyxdiPmHp9ZxoQhM2lAgc1Qw4wDcA_eZN_VLWU_eVojUA_f9ceLyVvqlpDrquumBV5AUFNFB8gIGxqqL5XO0NbnNGVBAJtfcT9_U2JpOSsU2E5_pf0rmUS05WeX-Y82O_HLoJOf3E_5WSz63pdws1kMaHzi_8x1BHyVKWKiDCyph0IEmVU0GCfsI4-hiuN8xXvUO2sunFe-TLP6l-wqQXa7sm2nx4F6lJdSI_9mj_vCjROnp6XlqbIRTYmVbdznq3w5-ikpcVxyTnDEo2UZdg"
  // Idéalement passé par des props ou un context
  
  const WSO2_GATEWAY_URL = "http://localhost:8280/translate/2.6";

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setStatus('Adika...');
    
    const endpoint = isBmmToMg 
      ? `${WSO2_GATEWAY_URL}/translate-bmm-to-plt` 
      : `${WSO2_GATEWAY_URL}/translate-plt-to-bmm`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({ text: inputText })
      });
      
      const result = await response.json();
      if (response.ok) {
        setOutputText(result.translated_text);
        setStatus('Vita ny fandikan-teny!');
      } else {
        setStatus('Diso: Tsy nahomby ny fandikan-teny.');
      }
    } catch (error) {
      setStatus('Diso: Nisy olana tampoka.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="bg-white/90 p-8 rounded-3xl shadow-2xl w-full max-w-2xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-[#087754] mb-2 tracking-tight">
        Fandikan-teny Betsimisaraka ↔ Malagasy
      </h1>
      <p className="text-center text-gray-700 mb-8">
        Mandika teny Betsimisaraka sy Malagasy ofisialy amin'ny lafiny roa.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        {/* Champ de saisie */}
        <div className="flex-1 w-full">
          <label className="block text-gray-600 text-sm font-semibold mb-2">
            {isBmmToMg ? "Teny Betsimisaraka" : "Teny Malagasy ofisialy"}
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows="5"
            className="w-full p-4 text-gray-800 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-[#087754] resize-none"
            placeholder="Soraty eto..."
          />
        </div>

        {/* Bouton Swap */}
        <button 
          onClick={() => setIsBmmToMg(!isBmmToMg)}
          className="bg-[#087754] hover:bg-[#0a9e6c] text-white rounded-full p-3 shadow-lg transition-transform active:rotate-180"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 17v1a3 3 0 003 3h10m0-4v-1a3 3 0 00-3-3H7m0 4l-4-4m0 0l4-4m-4 4h16" />
          </svg>
        </button>

        {/* Résultat */}
        <div className="flex-1 w-full">
          <label className="block text-gray-600 text-sm font-semibold mb-2">
            {isBmmToMg ? "Dikan-teny Malagasy" : "Dikan-teny Betsimisaraka"}
          </label>
          <textarea
            value={outputText}
            readOnly
            rows="5"
            className="w-full p-4 text-gray-800 bg-gray-100 rounded-xl border border-gray-300 resize-none"
            placeholder="Dikan-teny..."
          />
        </div>
      </div>

      <button
        onClick={handleTranslate}
        disabled={isLoading}
        className="w-full bg-[#087754] hover:bg-[#0a9e6c] text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50"
      >
        {isLoading ? "Am-pandikana..." : "Adika"}
      </button>

      <div className="text-center mt-4 text-gray-500 text-sm italic min-h-[1.5rem]">
        {status}
      </div>
    </div>
  );
};

export default Translator;