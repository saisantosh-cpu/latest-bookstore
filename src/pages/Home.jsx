import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Sparkles, Compass, Feather } from 'lucide-react';
import BookCard from '../components/BookCard';
import { useBooks } from '../context/BookContext';
import { mockCategories } from '../data/mockData';

const Home = () => {
  const { books } = useBooks();

  const featuredBook = books.find(b => b.featured) || books[0];
  const featuredCollection = books.filter(b => b.featured).slice(0, 3);
  const trendingBooks = books.filter(b => b.trending);
  const newArrivals = books.filter(b => b.newArrival);

  // Filter categories without "All"
  const categories = mockCategories.filter(cat => cat !== 'All');

  return (
    <div className="space-y-20 pb-20 font-sans">
      
      {/* 1. Compact Editorial Hero */}
      <section className="relative bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center p-6 sm:p-10 lg:p-14">
          
          {/* Left Editorial Copy */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#C85A32] dark:text-[#E06F45] mb-4">
              <Sparkles size={14} />
              <span>Curated Literature & Non-Fiction</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-5.5xl font-bold tracking-tight text-[#1C1A18] dark:text-[#F5F3EF] leading-[1.12] mb-5">
              Read something <br className="hidden sm:inline" />
              <span className="italic font-normal">worth remembering.</span>
            </h1>

            <p className="text-[#575047] dark:text-[#CBC4B8] text-base sm:text-lg leading-relaxed max-w-xl mb-8 font-normal">
              A thoughtful selection of contemporary literature, scientific discoveries, and timeless volumes chosen for readers who appreciate depth and bookbinding craft.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link 
                to="/books" 
                className="inline-flex items-center justify-center px-6 py-3 rounded bg-[#1C1A18] hover:bg-[#2E2A27] text-[#FAF6EE] dark:bg-[#FAF6EE] dark:hover:bg-[#FFFFFF] dark:text-[#1C1A18] text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-sm"
              >
                <span>Browse The Collection</span>
                <ArrowRight size={14} className="ml-2" />
              </Link>
              
              <Link 
                to="/books?filter=featured" 
                className="inline-flex items-center justify-center px-6 py-3 rounded bg-transparent hover:bg-[#F2EAE0] dark:hover:bg-[#22222B] text-[#1C1A18] dark:text-[#F5F3EF] border border-[#DCD0BF] dark:border-[#363644] text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Editor's Picks</span>
              </Link>
            </div>
          </div>

          {/* Right Featured Spotlight Book */}
          {featuredBook && (
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-sm bg-[#FAF6EE] dark:bg-[#121215] p-5 sm:p-6 rounded border border-[#EDE4D8] dark:border-[#2A2A33] shadow-book">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[#877F74] dark:text-[#8E887E] font-semibold mb-3">
                  <span>Spotlight Edition</span>
                  <span className="text-[#C85A32]">{featuredBook.genre}</span>
                </div>

                <Link to={`/books/${featuredBook.id}`} className="block group">
                  <div className="relative aspect-[2/3] w-full mb-4 overflow-hidden rounded-sm bg-[#FAF6EE] book-spine shadow-book group-hover:shadow-book-hover transition-all duration-300">
                    <img 
                      src={featuredBook.image} 
                      alt={featuredBook.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>

                  <h2 className="font-serif font-bold text-lg text-[#1C1A18] dark:text-[#F5F3EF] group-hover:text-[#C85A32] dark:group-hover:text-[#E06F45] transition-colors line-clamp-1 mb-1">
                    {featuredBook.title}
                  </h2>
                </Link>

                <p className="text-xs text-[#575047] dark:text-[#CBC4B8] mb-3">By {featuredBook.author}</p>
                <p className="text-xs text-[#877F74] dark:text-[#8E887E] line-clamp-2 mb-4 leading-relaxed">
                  {featuredBook.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-[#EDE4D8] dark:border-[#2A2A33]">
                  <span className="font-serif font-bold text-lg text-[#1C1A18] dark:text-[#F5F3EF]">
                    ₹{Number(featuredBook.price).toLocaleString('en-IN')}
                  </span>
                  <Link 
                    to={`/books/${featuredBook.id}`} 
                    className="text-xs font-semibold uppercase tracking-wider text-[#C85A32] dark:text-[#E06F45] hover:underline"
                  >
                    Read Details &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Catalog discovery stays intentionally compact: it is a starting point,
          not a second full navigation menu. */}
      <section>
        <div className="mb-6 pb-3 border-b border-[#DCD0BF]/70 dark:border-[#2A2A33]">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">Shop by Category</h2>
          <p className="text-xs sm:text-sm text-[#877F74] dark:text-[#8E887E] mt-0.5">Find the right study material, from school foundations to professional courses.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ['School', '/books/school'], ['Intermediate', '/books/intermediate'], ['Degree', '/books/degree'],
            ['Engineering / B.Tech', '/books/engineering'], ['Medical', '/books/medical'], ['Competitive Exams', '/books/competitive'],
          ].map(([label, to]) => <Link key={to} to={to} className="group p-4 bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] hover:border-[#C85A32] dark:hover:border-[#E06F45] transition-all hover:-translate-y-0.5 shadow-sm">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#877F74] group-hover:text-[#C85A32]">Catalog</span>
            <h3 className="font-serif font-bold text-base text-[#1C1A18] dark:text-[#F5F3EF] mt-1 group-hover:text-[#C85A32]">{label}</h3>
          </Link>)}
        </div>
        <div className="mt-6">
          <h3 className="font-serif text-xl font-bold text-[#1C1A18] dark:text-[#F5F3EF] mb-3">Student Essentials</h3>
          <div className="flex flex-wrap gap-3">
            {[['Stationery', '/stationery'], ['Medical Aprons', '/essentials/medical-aprons'], ['Medical Kits', '/essentials/medical-kits']].map(([label, to]) => <Link key={to} to={to} className="px-4 py-2 rounded border border-[#DCD0BF] dark:border-[#363644] text-xs font-semibold text-[#575047] dark:text-[#CBC4B8] hover:text-[#C85A32] hover:border-[#C85A32] transition-colors">{label}</Link>)}
          </div>
        </div>
      </section>

      {/* 2. Genre Discovery / Curated Categories */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6 pb-3 border-b border-[#DCD0BF]/70 dark:border-[#2A2A33]">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
              Browse by Subject
            </h2>
            <p className="text-xs sm:text-sm text-[#877F74] dark:text-[#8E887E] mt-0.5">
              Explore volumes organized across disciplines and literary forms
            </p>
          </div>
          <Link to="/books" className="text-xs font-semibold uppercase tracking-wider text-[#C85A32] dark:text-[#E06F45] hover:underline whitespace-nowrap">
            View All Subjects &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((category) => {
            const count = books.filter(b => b.genre === category).length;
            return (
              <Link
                key={category}
                to={`/books?category=${encodeURIComponent(category)}`}
                className="group p-4 bg-[#FFFFFF] dark:bg-[#1A1A20] rounded border border-[#EDE4D8] dark:border-[#2A2A33] hover:border-[#C85A32] dark:hover:border-[#E06F45] transition-all hover:-translate-y-0.5 shadow-sm"
              >
                <div className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#877F74] dark:text-[#8E887E] group-hover:text-[#C85A32] transition-colors mb-1">
                  Genre
                </div>
                <h3 className="font-serif font-bold text-base text-[#1C1A18] dark:text-[#F5F3EF] group-hover:text-[#C85A32] dark:group-hover:text-[#E06F45] transition-colors truncate">
                  {category}
                </h3>
                <span className="text-[11px] text-[#877F74] dark:text-[#8E887E] mt-1 block">
                  {count} {count === 1 ? 'title' : 'titles'}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Editorial Collection (Asymmetric / Varied Layout) */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6 pb-3 border-b border-[#DCD0BF]/70 dark:border-[#2A2A33]">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
              Editor's Curated Selection
            </h2>
            <p className="text-xs sm:text-sm text-[#877F74] dark:text-[#8E887E] mt-0.5">
              Standout works selected for their intellectual rigor and storytelling
            </p>
          </div>
          <Link to="/books?filter=featured" className="text-xs font-semibold uppercase tracking-wider text-[#C85A32] dark:text-[#E06F45] hover:underline">
            All Featured &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCollection.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* 4. Digital Bookshelf: Trending Now */}
      {trendingBooks.length > 0 && (
        <section className="bg-[#FFFFFF] dark:bg-[#1A1A20] p-6 sm:p-8 rounded border border-[#EDE4D8] dark:border-[#2A2A33]">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6 pb-3 border-b border-[#EDE4D8] dark:border-[#2A2A33]">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest-editorial font-bold text-[#C85A32] mb-1">
                <Compass size={13} />
                <span>On The Shelf</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
                Popular & Notable Reads
              </h2>
            </div>
            <Link to="/books?filter=bestseller" className="text-xs font-semibold uppercase tracking-wider text-[#C85A32] dark:text-[#E06F45] hover:underline">
              Explore All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingBooks.slice(0, 4).map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {/* 5. Digital Bookshelf: New on the Shelf */}
      {newArrivals.length > 0 && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6 pb-3 border-b border-[#DCD0BF]/70 dark:border-[#2A2A33]">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
                Recent Arrivals
              </h2>
              <p className="text-xs sm:text-sm text-[#877F74] dark:text-[#8E887E] mt-0.5">
                Fresh editions newly cataloged in our bookstore
              </p>
            </div>
            <Link to="/books?sort=newest" className="text-xs font-semibold uppercase tracking-wider text-[#C85A32] dark:text-[#E06F45] hover:underline">
              View New Releases &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.slice(0, 4).map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Editorial Brand Statement */}
      <section className="bg-[#FAF6EE] dark:bg-[#121215] border border-[#DCD0BF] dark:border-[#2A2A33] rounded p-8 sm:p-12 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#EDE4D8] dark:bg-[#22222B] flex items-center justify-center text-[#C85A32] dark:text-[#E06F45]">
            <Feather size={20} />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1A18] dark:text-[#F5F3EF]">
            The Art of the Bookshop
          </h2>
          <p className="text-sm sm:text-base text-[#575047] dark:text-[#CBC4B8] leading-relaxed">
            At S LV BOOK CENTER, serving readers since 1997, we believe great books endure because of the ideas they carry and the tangible joy of physical reading. Every volume in our catalog is maintained with care for readers, thinkers, and collectors alike.
          </p>
          <div className="pt-2">
            <Link 
              to="/books" 
              className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-[#C85A32] dark:text-[#E06F45] hover:underline"
            >
              Start Exploring The Stacks &rarr;
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
