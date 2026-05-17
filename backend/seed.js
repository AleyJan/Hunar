require('dotenv').config();
const mongoose = require('mongoose');
const Provider = require('./src/models/Provider');

const providers = [
    {
        name: 'Ahmad Karimi',
        avatar: 'AK',
        phone: '0312-1234567',
        services: ['AC Repair', 'Electrical'],
        sector: 'G-11',
        city: 'Islamabad',
        lat: 33.6938, lng: 73.0552,
        rating: 4.9, reviewCount: 47,
        onTimeRate: 97, cancellationRate: 0.02,
        hourlyRate: 900, experienceYears: 8,
        jobComplexity: 'intermediate',
        certifications: ['AC Specialist'],
        bio: 'AC aur electrical kaam mein 8 saal ka tajruba',
        verified: true, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Muhammad Zubair',
        avatar: 'MZ',
        phone: '0333-2345678',
        services: ['Plumbing', 'AC Repair'],
        sector: 'G-13',
        city: 'Islamabad',
        lat: 33.6769, lng: 73.0415,
        rating: 4.2, reviewCount: 23,
        onTimeRate: 78, cancellationRate: 0.14,
        hourlyRate: 700, experienceYears: 5,
        jobComplexity: 'basic',
        certifications: [],
        bio: 'Plumbing aur pipe fitting ka kaam karta hun',
        verified: true, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Bilal Hassan',
        avatar: 'BH',
        phone: '0321-3456789',
        services: ['Electrical', 'Carpentry'],
        sector: 'G-12',
        city: 'Islamabad',
        lat: 33.6853, lng: 73.0484,
        rating: 4.5, reviewCount: 31,
        onTimeRate: 88, cancellationRate: 0.05,
        hourlyRate: 800, experienceYears: 6,
        jobComplexity: 'intermediate',
        certifications: ['Electrician License'],
        bio: 'Electrical wiring aur carpentry dono karta hun',
        verified: true, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Usman Ali',
        avatar: 'UA',
        phone: '0345-4567890',
        services: ['Plumbing', 'AC Repair', 'Electrical'],
        sector: 'G-10',
        city: 'Islamabad',
        lat: 33.7022, lng: 73.0621,
        rating: 4.7, reviewCount: 52,
        onTimeRate: 93, cancellationRate: 0.03,
        hourlyRate: 1100, experienceYears: 10,
        jobComplexity: 'complex',
        certifications: ['Master Plumber', 'AC Specialist'],
        bio: 'Multi-skilled — plumbing, AC, aur electrical sab kuch',
        verified: true, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Tariq Mehmood',
        avatar: 'TM',
        phone: '0300-5678901',
        services: ['Painting', 'Carpentry'],
        sector: 'F-10',
        city: 'Islamabad',
        lat: 33.7094, lng: 73.0278,
        rating: 4.3, reviewCount: 19,
        onTimeRate: 82, cancellationRate: 0.08,
        hourlyRate: 600, experienceYears: 7,
        jobComplexity: 'basic',
        certifications: [],
        bio: 'Ghar ki painting aur carpentry ka kaam',
        verified: true, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Faisal Iqbal',
        avatar: 'FI',
        phone: '0311-6789012',
        services: ['AC Repair'],
        sector: 'G-14',
        city: 'Islamabad',
        lat: 33.6685, lng: 73.0346,
        rating: 4.6, reviewCount: 38,
        onTimeRate: 91, cancellationRate: 0.04,
        hourlyRate: 950, experienceYears: 9,
        jobComplexity: 'complex',
        certifications: ['AC Specialist', 'Refrigeration Expert'],
        bio: 'AC repair mein expert — sab brands ka tajruba',
        verified: true, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Hassan Raza',
        avatar: 'HR',
        phone: '0322-7890123',
        services: ['Mechanics', 'Electrical'],
        sector: 'I-8',
        city: 'Islamabad',
        lat: 33.6601, lng: 73.0823,
        rating: 4.1, reviewCount: 15,
        onTimeRate: 75, cancellationRate: 0.12,
        hourlyRate: 750, experienceYears: 4,
        jobComplexity: 'intermediate',
        certifications: [],
        bio: 'Car mechanics aur electrical repairs',
        verified: false, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Kamran Shahid',
        avatar: 'KS',
        phone: '0333-8901234',
        services: ['Tutoring'],
        sector: 'F-11',
        city: 'Islamabad',
        lat: 33.7185, lng: 73.0194,
        rating: 4.8, reviewCount: 61,
        onTimeRate: 96, cancellationRate: 0.02,
        hourlyRate: 1200, experienceYears: 12,
        jobComplexity: 'intermediate',
        certifications: ['B.Ed', 'Math Specialist'],
        bio: 'Math aur science ki tuition — matric se inter tak',
        verified: true, isAvailable: true,
        slots: ['15:00', '17:00', '19:00', '20:00', '21:00']
    },
    {
        name: 'Imran Khan',
        avatar: 'IK',
        phone: '0344-9012345',
        services: ['Plumbing'],
        sector: 'G-9',
        city: 'Islamabad',
        lat: 33.7106, lng: 73.0553,
        rating: 3.9, reviewCount: 11,
        onTimeRate: 68, cancellationRate: 0.18,
        hourlyRate: 550, experienceYears: 3,
        jobComplexity: 'basic',
        certifications: [],
        bio: 'Plumbing ka basic kaam karta hun',
        verified: false, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Nadeem Butt',
        avatar: 'NB',
        phone: '0301-0123456',
        services: ['Electrical', 'AC Repair'],
        sector: 'G-11',
        city: 'Islamabad',
        lat: 33.6938, lng: 73.0552,
        rating: 4.4, reviewCount: 29,
        onTimeRate: 85, cancellationRate: 0.07,
        hourlyRate: 850, experienceYears: 6,
        jobComplexity: 'intermediate',
        certifications: ['Electrician License'],
        bio: 'Electrical aur AC dono ka kaam',
        verified: true, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Sajid Hussain',
        avatar: 'SH',
        phone: '0312-1122334',
        services: ['Carpentry'],
        sector: 'G-13',
        city: 'Islamabad',
        lat: 33.6769, lng: 73.0415,
        rating: 4.6, reviewCount: 33,
        onTimeRate: 90, cancellationRate: 0.04,
        hourlyRate: 700, experienceYears: 8,
        jobComplexity: 'intermediate',
        certifications: ['Master Carpenter'],
        bio: 'Furniture banwana aur repairs — 8 saal ka tajruba',
        verified: true, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Rizwan Ahmed',
        avatar: 'RA',
        phone: '0323-2233445',
        services: ['Painting'],
        sector: 'F-10',
        city: 'Islamabad',
        lat: 33.7094, lng: 73.0278,
        rating: 4.0, reviewCount: 14,
        onTimeRate: 72, cancellationRate: 0.15,
        hourlyRate: 500, experienceYears: 2,
        jobComplexity: 'basic',
        certifications: [],
        bio: 'Interior aur exterior painting ka kaam',
        verified: false, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Asif Nawaz',
        avatar: 'AN',
        phone: '0334-3344556',
        services: ['AC Repair', 'Plumbing'],
        sector: 'G-15',
        city: 'Islamabad',
        lat: 33.6601, lng: 73.0208,
        rating: 4.7, reviewCount: 44,
        onTimeRate: 94, cancellationRate: 0.03,
        hourlyRate: 1000, experienceYears: 11,
        jobComplexity: 'complex',
        certifications: ['AC Specialist'],
        bio: 'AC repair aur plumbing — G-15 area specialist',
        verified: true, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Zeeshan Malik',
        avatar: 'ZM',
        phone: '0345-4455667',
        services: ['Mechanics'],
        sector: 'I-8',
        city: 'Islamabad',
        lat: 33.6601, lng: 73.0823,
        rating: 4.3, reviewCount: 22,
        onTimeRate: 80, cancellationRate: 0.09,
        hourlyRate: 800, experienceYears: 5,
        jobComplexity: 'intermediate',
        certifications: ['Auto Mechanic'],
        bio: 'Car aur bike repair — I-8 workshop',
        verified: true, isAvailable: true,
        slots: ['09:00', '11:00', '13:00', '15:00', '17:00']
    },
    {
        name: 'Pervez Akhtar',
        avatar: 'PA',
        phone: '0300-5566778',
        services: ['Tutoring'],
        sector: 'G-10',
        city: 'Islamabad',
        lat: 33.7022, lng: 73.0621,
        rating: 4.9, reviewCount: 73,
        onTimeRate: 98, cancellationRate: 0.01,
        hourlyRate: 1500, experienceYears: 15,
        jobComplexity: 'complex',
        certifications: ['M.Phil Mathematics', 'Cambridge Certified'],
        bio: 'O/A levels aur university math — 15 saal ka tajruba',
        verified: true, isAvailable: true,
        slots: ['15:00', '17:00', '19:00', '20:00', '21:00']
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        await Provider.deleteMany({});
        console.log('🗑️  Cleared existing providers');

        for (const provider of providers) {
            const saved = await Provider.create(provider);
            console.log(`✅ Added: ${saved.name} — ${saved.sector} — ${saved.services.join(', ')}`);
        }

        console.log('\n🎉 All 15 providers seeded successfully!');
        console.log('You can now test the /api/providers endpoint');

    } catch (error) {
        console.error('❌ Seed error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
};

seedDB();