// pages/index.js
import GuessingGame from '../components/GuessingGame';
import ObscuroWidget from '../components/ObscuroWidget';


export default function Home() {
  return (
    <div>
      <ObscuroWidget />
      <GuessingGame guessContractAddress="0x0020407a683d8AA20A22F2230cFa0D8057F3FDf4" erc20ContractAddress="0x1eAbD4aaDb9FD704D5413DA38F36AaCFa92f5FFA" />
    </div>
  );
}
