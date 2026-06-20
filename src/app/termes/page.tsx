export default function TermesPage() {
  return (
    <main className="min-h-screen bg-fons">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-medium text-text-principal mb-2">
          Condicions d&apos;ús — Rutes Muntanya
        </h1>
        <p className="text-xs text-text-secundari mb-8">
          Última actualització: 2026
        </p>

        <div className="flex flex-col gap-6 text-sm text-text-principal leading-relaxed">

          <p>
            Abans de crear el teu compte, llegeix-te això amb calma. No és un
            text de farciment legal sense sentit — explica coses importants
            sobre com funciona això i què esperem de tu.
          </p>

          <section>
            <h2 className="text-base font-medium text-text-principal mb-2">
              1. Què és això (i què no és)
            </h2>
            <p>
              Rutes Muntanya és una eina per cronometrar-te a tu mateix
              mentre fas rutes de muntanya, a peu o amb bici, al teu ritme i
              quan vulguis. <strong>No és una cursa ni una competició
              organitzada.</strong> No hi ha premis, no hi ha inscripcions,
              no hi ha cap organització darrere controlant que tot vagi bé
              sobre el terreny mentre hi ets. Els rànquings són només per
              diversió i per piular-te amb tu mateix o amb amics — no tenen
              cap valor competitiu oficial.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-principal mb-2">
              2. Fas la ruta sota la teva responsabilitat
            </h2>
            <p className="mb-3">
              Anar a la muntanya (o fer una ruta de carretera o BTT) comporta
              riscos reals: caigudes, desorientació, climatologia, fauna,
              terreny en mal estat, i tot el que ja saps si tens experiència
              en aquest món. <strong>Tu decideixes fer la ruta, i ho fas sota
              la teva pròpia responsabilitat.</strong> Nosaltres no
              t&apos;acompanyem, no et vigilem, i no podem garantir-te que
              res surti malament.
            </p>
            <p className="mb-3">Coses concretes que necessitem que entenguis:</p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>
                <strong>No controlem l&apos;estat del terreny en temps
                real.</strong> Una ruta pot estar tallada, malmesa, amb
                esllavissades, arbres caiguts o qualsevol altre problema que
                no sabem que existeix en el moment que la fas. Comprova
                sempre l&apos;estat actual abans de sortir.
              </li>
              <li>
                <strong>No ens fem responsables de l&apos;estat físic dels
                tags NFC/Bluetooth.</strong> Poden estar trencats,
                descarregats, tapats per vegetació o neu, o simplement no
                funcionar per qualsevol motiu. Si un tag no respon, no és
                motiu per fer res arriscat per intentar trobar-lo.
              </li>
              <li>
                <strong>Si et fas mal, si et perds, o si et passa qualsevol
                cosa durant la ruta, és responsabilitat teva.</strong> No
                oferim assegurança, rescat, ni cap mena de cobertura.
              </li>
              <li>
                Vés equipat correctament: aigua, roba adequada, mòbil
                carregat, i material tècnic si la ruta ho requereix. Avisa
                algú d&apos;on vas i quan preveus tornar.
              </li>
            </ul>
          </section>

          <section className="bg-superficie border border-vora rounded-card p-4">
            <h3 className="text-sm font-medium text-text-principal mb-2">
              Una recomanació seriosa
            </h3>
            <p>
              Si fas muntanya amb regularitat, et recomanem fermament que
              estiguis <strong>federat</strong> (a través de la federació
              d&apos;esports de muntanya del teu territori) o que tinguis
              una <strong>assegurança d&apos;accidents</strong> que cobreixi
              activitats de muntanya. Moltes llicències federatives inclouen
              cobertura de rescat a un cost molt baix anual.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-principal mb-2">
              3. Respecta el medi
            </h2>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>No deixis brossa, ni la teva ni la que trobis si pots evitar-ho.</li>
              <li>No surtis dels camins marcats si això pot malmetre vegetació.</li>
              <li>Respecta la fauna, la flora, i les zones amb restriccions temporals.</li>
              <li>
                Si veus un tag malmès o mogut de lloc, ens ajudaria molt que
                ens ho fessis saber.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-principal mb-2">
              4. El teu compte i el teu nom als rànquings
            </h2>
            <p>
              Quan et registres, pots triar que el teu nom real aparegui als
              rànquings públics, o bé definir un <strong>àlies</strong> que
              es mostrarà en lloc del teu nom. És la teva decisió i la pots
              canviar quan vulguis des del teu perfil.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-principal mb-2">
              5. Acceptació
            </h2>
            <p>
              Per crear un compte, has de marcar que has llegit i acceptes
              aquestes condicions. Ens reservem el dret d&apos;actualitzar
              aquest text quan calgui.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
